import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATS, ING, type CatKey } from '../data';
import { CAT_LABEL, EMOJIS, UNITS, draftToRecipe, guessIngredient, importFromUrl, looksLikeUrl, matchIngredient, newRecipeId, parseRecipeText, parseShared, type Draft, type DraftIng } from '../import';
import { useStore } from '../store';
import { useColors } from '../theme';
import { Btn, Chip, H2, Row, Sub } from './ui';

export const emptyDraft = (): Draft => ({ n: '', e: '🍽️', t: 30, servings: 2, ings: [{ name: '', qty: null, unit: '' }], steps: [] });

const num = (s: string): number | null => {
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};
const numText = (v: number | null) => (v === null ? '' : String(Math.round(v * 100) / 100).replace('.', ','));

/** Ce que l'app va faire de l'ingrédient, affiché sous la ligne. */
function ingStatus(di: DraftIng): { label: string; cat: CatKey; known: boolean } {
  const id = matchIngredient(di.name);
  if (id) return { label: `✓ ${ING[id][0]} (déjà connu)`, cat: ING[id][1], known: true };
  const g = guessIngredient(di.name || '?', di.unit);
  if (g[4] === 's') return { label: 'Placard : pas ajouté à la liste de courses', cat: g[1], known: false };
  const cat = di.cat ?? g[1];
  return { label: `Nouveau · ${CAT_LABEL[cat]}`, cat, known: false };
}

export function EditorBody({ initial, id, onSaved }: { initial: Draft; id?: string; onSaved: (id: string) => void }) {
  const { S, saveRecipe, toast } = useStore();
  const c = useColors();
  const [d, setD] = useState<Draft>(initial);
  const [stepsText, setStepsText] = useState(initial.steps.join('\n'));
  const [open, setOpen] = useState<number | null>(null);
  const [tText, setTText] = useState(String(initial.t));
  const [pText, setPText] = useState(String(initial.servings));

  const patchIng = (i: number, p: Partial<DraftIng>) => setD((x) => ({ ...x, ings: x.ings.map((g, k) => (k === i ? { ...g, ...p } : g)) }));
  const input = [st.input, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }];

  const save = () => {
    if (!d.n.trim()) {
      toast('Donne un nom à la recette');
      return;
    }
    const draft: Draft = { ...d, t: num(tText) ?? 30, servings: Math.max(1, Math.round(num(pText) ?? 2)), steps: stepsText.split(/\n+/) };
    const rid = id ?? newRecipeId();
    const { recipe, newIng } = draftToRecipe(draft, rid, S.myIng);
    saveRecipe(recipe, newIng);
    toast(id ? 'Recette modifiée' : 'Recette ajoutée');
    onSaved(rid);
  };

  return (
    <>
      <Text style={[st.label, { color: c.muted }]}>Nom</Text>
      <TextInput value={d.n} onChangeText={(n) => setD((x) => ({ ...x, n }))} placeholder="Ex. : Tarte aux poireaux" placeholderTextColor={c.muted} style={input} />

      <Text style={[st.label, { color: c.muted }]}>Icône</Text>
      <Row style={{ gap: 4 }}>
        {EMOJIS.map((e) => (
          <Pressable key={e} onPress={() => setD((x) => ({ ...x, e }))} accessibilityLabel={`Icône ${e}`} style={[st.emoji, { borderColor: d.e === e ? c.accent : 'transparent', backgroundColor: d.e === e ? c.surface : 'transparent' }]}>
            <Text style={{ fontSize: 24 }}>{e}</Text>
          </Pressable>
        ))}
      </Row>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={[st.label, { color: c.muted }]}>Temps (min)</Text>
          <TextInput value={tText} onChangeText={setTText} keyboardType="number-pad" style={input} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[st.label, { color: c.muted }]}>Quantités pour (pers.)</Text>
          <TextInput value={pText} onChangeText={setPText} keyboardType="number-pad" style={input} />
        </View>
      </View>
      <Sub style={{ fontSize: 13 }}>L’app recalcule ensuite selon le nombre de personnes choisi dans Semaine.</Sub>

      <H2 style={{ fontSize: 18 }}>Ingrédients</H2>
      {d.ings.map((g, i) => {
        const stt = ingStatus(g);
        return (
          <View key={i} style={[st.ingBox, { borderColor: c.line, backgroundColor: c.surface }]}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TextInput
                value={numText(g.qty)}
                onChangeText={(v) => patchIng(i, { qty: v.trim() ? num(v) : null })}
                placeholder="Qté"
                placeholderTextColor={c.muted}
                keyboardType="decimal-pad"
                style={[st.input, st.qty, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
              />
              <Pressable onPress={() => setOpen(open === i ? null : i)} style={[st.unit, { borderColor: c.line, backgroundColor: c.bg }]} accessibilityLabel="Choisir l’unité">
                <Text style={{ color: c.ink, fontSize: 14 }}>{g.unit || 'pièce'}</Text>
              </Pressable>
              <TextInput
                value={g.name}
                onChangeText={(name) => patchIng(i, { name })}
                placeholder="Ingrédient"
                placeholderTextColor={c.muted}
                style={[st.input, { flex: 1, color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
              />
              <Pressable onPress={() => setOpen(open === i ? null : i)} hitSlop={8} accessibilityLabel="Plus d’options">
                <Text style={{ color: c.muted, fontSize: 18 }}>{open === i ? '▲' : '⋯'}</Text>
              </Pressable>
            </View>
            {g.name.trim() ? <Text style={{ color: stt.known ? c.leaf : c.muted, fontSize: 12, marginTop: 4 }}>{stt.label}</Text> : null}
            {open === i ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Text style={[st.label, { color: c.muted, marginTop: 0 }]}>Unité</Text>
                <Row style={{ gap: 6 }}>
                  {UNITS.map((u) => (
                    <Chip key={u || 'pc'} label={u || 'pièce'} on={g.unit === u} onPress={() => patchIng(i, { unit: u })} />
                  ))}
                </Row>
                {!stt.known ? (
                  <>
                    <Text style={[st.label, { color: c.muted, marginTop: 0 }]}>Rayon</Text>
                    <Row style={{ gap: 6 }}>
                      {CATS.map(([k, l]) => (
                        <Chip key={k} label={l} on={stt.cat === k} onPress={() => patchIng(i, { cat: k })} />
                      ))}
                    </Row>
                  </>
                ) : null}
                <View style={{ alignSelf: 'flex-start' }}>
                  <Btn
                    kind="ghost"
                    label="🗑 Retirer l’ingrédient"
                    onPress={() => {
                      setD((x) => ({ ...x, ings: x.ings.filter((_, k) => k !== i) }));
                      setOpen(null);
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
      <View style={{ alignSelf: 'flex-start' }}>
        <Btn kind="ghost" label="+ Ajouter un ingrédient" onPress={() => setD((x) => ({ ...x, ings: [...x.ings, { name: '', qty: null, unit: '' }] }))} />
      </View>

      <H2 style={{ fontSize: 18 }}>Étapes</H2>
      <Sub style={{ fontSize: 13 }}>Une étape par ligne.</Sub>
      <TextInput value={stepsText} onChangeText={setStepsText} multiline placeholder={'Faire revenir l’oignon.\nAjouter…'} placeholderTextColor={c.muted} style={[input, { minHeight: 140, textAlignVertical: 'top' }]} />

      {d.src ? <Sub style={{ fontSize: 12 }}>Source : {d.src}</Sub> : null}
      <Btn kind="accent" full style={{ marginTop: 14 }} label={id ? 'Enregistrer les modifications' : 'Enregistrer la recette'} onPress={save} />
    </>
  );
}

export function ImportBody({ onDraft, onImported }: { onDraft: (d: Draft) => void; onImported: () => void }) {
  const { saveRecipe, toast } = useStore();
  const c = useColors();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    const v = text.trim();
    setErr('');
    if (!v) {
      setErr('Colle d’abord un lien ou le texte d’une recette.');
      return;
    }
    const shared = parseShared(v);
    if (shared) {
      shared.recipes.forEach((r, k) => saveRecipe({ ...r, id: newRecipeId() + k }, k === 0 ? shared.ing : {}));
      toast(shared.recipes.length > 1 ? `${shared.recipes.length} recettes ajoutées` : `${shared.recipes[0].n} ajoutée`);
      onImported();
      return;
    }
    if (looksLikeUrl(v)) {
      setBusy(true);
      try {
        onDraft(await importFromUrl(v));
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Impossible de lire cette page.');
      } finally {
        setBusy(false);
      }
      return;
    }
    const d = parseRecipeText(v);
    if (!d.ings.length && !d.steps.length) {
      setErr('Je n’ai pas trouvé d’ingrédients ni d’étapes. Vérifie le texte collé.');
      return;
    }
    onDraft(d);
  };

  return (
    <>
      <Sub>Colle au choix :</Sub>
      <Sub style={{ fontSize: 14 }}>• le lien d’une recette (Marmiton, 750g, Cuisine AZ, blogs…)</Sub>
      <Sub style={{ fontSize: 14 }}>• le texte d’une recette (titre, ingrédients, étapes)</Sub>
      <Sub style={{ fontSize: 14 }}>• un message de recette partagé depuis l’app</Sub>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoCapitalize="none"
        placeholder="https://… ou texte de la recette"
        placeholderTextColor={c.muted}
        style={[st.input, { minHeight: 180, textAlignVertical: 'top', color: c.ink, backgroundColor: c.surface, borderColor: c.line, marginTop: 8 }]}
      />
      {err ? <Text style={{ color: c.warn, fontSize: 14 }}>{err}</Text> : null}
      <Row style={{ marginTop: 6 }}>
        <Btn
          kind="ghost"
          label="📋 Coller"
          onPress={async () => {
            try {
              setText(await Clipboard.getStringAsync());
            } catch {
              setErr('Impossible de lire le presse-papiers.');
            }
          }}
        />
        {busy ? <ActivityIndicator color={c.leaf} /> : <Btn kind="accent" label="Importer" onPress={run} />}
      </Row>
      <Sub style={{ fontSize: 13, marginTop: 8 }}>Tu pourras relire et corriger la recette avant de l’enregistrer.</Sub>
    </>
  );
}

const st = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  emoji: { borderWidth: 2, borderRadius: 10, padding: 3 },
  ingBox: { borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 6 },
  qty: { width: 64, paddingHorizontal: 8, textAlign: 'center' },
  unit: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 11, minWidth: 54, alignItems: 'center' },
});
