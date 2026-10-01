import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { DS, MEALS } from '../data';
import { allRecipes, ingOf, recipeOf } from '../catalog';
import { recipeToDraft, shareText, type Draft } from '../import';
import { activeMeals, fits, fmt, pickRandom, scale, slotLabel } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';
import { RecipeCard } from './RecipeCard';
import { EditorBody, ImportBody, emptyDraft } from './RecipeForms';
import { Btn, H2, Row, Sheet, Sub } from './ui';

type SheetState =
  | { type: 'picker'; k: string }
  | { type: 'recipe'; id: string; k?: string }
  | { type: 'text'; text: string }
  | { type: 'editor'; draft: Draft; id?: string; key: number }
  | { type: 'import' }
  | null;
type SheetApi = {
  openPicker: (k: string) => void;
  openRecipe: (id: string, k?: string) => void;
  openText: (text: string) => void;
  openEditor: (draft?: Draft, id?: string) => void;
  openImport: () => void;
  close: () => void;
};

const Ctx = createContext<SheetApi | null>(null);
export const useSheets = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSheets hors de SheetProvider');
  return v;
};

export async function shareRecipes(ids: string[]) {
  const list = ids.map(recipeOf).filter((r): r is NonNullable<typeof r> => !!r);
  if (!list.length) return;
  try {
    await Share.share({ message: shareText(list), title: list.length === 1 ? list[0].n : 'Mes recettes' });
  } catch {
    // partage annulé
  }
}

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>(null);
  // Pile : « Voir » depuis le sélecteur ouvre la recette, et on revient au sélecteur.
  const [back, setBack] = useState<SheetState>(null);
  const api: SheetApi = {
    openPicker: (k) => {
      setBack(null);
      setSheet({ type: 'picker', k });
    },
    openRecipe: (id, k) => {
      setBack(sheet?.type === 'picker' ? sheet : null);
      setSheet({ type: 'recipe', id, k });
    },
    openText: (text) => setSheet({ type: 'text', text }),
    openEditor: (draft, id) => {
      setBack(sheet?.type === 'recipe' ? sheet : null);
      setSheet({ type: 'editor', draft: draft ?? emptyDraft(), id, key: Date.now() });
    },
    openImport: () => {
      setBack(null);
      setSheet({ type: 'import' });
    },
    close: () => {
      setSheet(null);
      setBack(null);
    },
  };
  const closeOrBack = () => {
    if (back) {
      setSheet(back);
      setBack(null);
    } else api.close();
  };
  const rec = sheet?.type === 'recipe' ? recipeOf(sheet.id) : undefined;
  const title =
    sheet?.type === 'picker'
      ? slotLabel(sheet.k)
      : sheet?.type === 'recipe'
        ? rec?.n ?? ''
        : sheet?.type === 'editor'
          ? sheet.id
            ? 'Modifier la recette'
            : 'Nouvelle recette'
          : sheet?.type === 'import'
            ? 'Importer une recette'
            : 'Ta liste';
  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Une seule Modal dont le contenu change : iOS n'aime pas enchaîner deux Modals. */}
      <Sheet
        visible={!!sheet}
        onClose={sheet?.type === 'recipe' || sheet?.type === 'editor' ? closeOrBack : api.close}
        title={title}
        icon={rec?.e}
        scrollKey={sheet ? sheet.type + (sheet.type === 'recipe' ? sheet.id : '') : 'none'}
      >
        {sheet?.type === 'picker' && <PickerBody key={sheet.k} k={sheet.k} onClose={api.close} />}
        {sheet?.type === 'recipe' && <RecipeBody id={sheet.id} k={sheet.k} onDone={api.close} />}
        {sheet?.type === 'text' && <TextBody text={sheet.text} />}
        {sheet?.type === 'editor' && (
          <EditorBody
            key={sheet.key}
            initial={sheet.draft}
            id={sheet.id}
            onSaved={(id) => {
              setBack(null);
              setSheet({ type: 'recipe', id });
            }}
          />
        )}
        {sheet?.type === 'import' && (
          <ImportBody onDraft={(d) => setSheet({ type: 'editor', draft: d, key: Date.now() })} onImported={api.close} />
        )}
      </Sheet>
    </Ctx.Provider>
  );
}

function PickerBody({ k, onClose }: { k: string; onClose: () => void }) {
  const { S, set, toast } = useStore();
  const { openRecipe } = useSheets();
  const c = useColors();
  const [q, setQ] = useState('');
  const d = +k.split('-')[0];
  const cur = S.plan[k];
  const rows = allRecipes()
    .filter((r) => r.n.toLowerCase().includes(q.toLowerCase()))
    .map((r) => [r, fits(S, r, d)] as const)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const put = (id: string) => {
    set((s) => ({ plan: { ...s.plan, [k]: id } }));
    onClose();
    const r = recipeOf(id);
    if (r) toast(`${r.n} : ${slotLabel(k).toLowerCase()}`);
  };
  return (
    <>
      <Row>
        <Btn kind="accent" label="🎲 Au hasard" onPress={() => put(pickRandom(S, d, new Set(Object.values(S.plan))))} />
        <Btn kind="ghost" label="🥡 Restes" onPress={() => put('restes')} />
        {cur ? (
          <Btn
            kind="ghost"
            label="Vider"
            onPress={() => {
              set((s) => {
                const plan = { ...s.plan };
                delete plan[k];
                return { plan };
              });
              onClose();
            }}
          />
        ) : null}
      </Row>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Chercher un plat"
        placeholderTextColor={c.muted}
        clearButtonMode="while-editing"
        style={[st.search, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
      />
      {rows.map(([r, ok]) => (
        <View key={r.id} style={st.prow}>
          <RecipeCard r={r} onPress={() => put(r.id)} bad={ok ? undefined : 'Produit frais un peu loin des courses'} style={{ flex: 1 }} compact />
          <Pressable onPress={() => openRecipe(r.id, k)} style={[st.see, { borderColor: c.line, backgroundColor: c.surface }]} accessibilityRole="button" accessibilityLabel={`Voir ${r.n}`}>
            <Text style={{ color: c.ink, fontSize: 14 }}>Voir</Text>
          </Pressable>
        </View>
      ))}
    </>
  );
}

function RecipeBody({ id, k, onDone }: { id: string; k?: string; onDone: () => void }) {
  const { S, set, toast, deleteRecipe } = useStore();
  const { openEditor } = useSheets();
  const c = useColors();
  const r = recipeOf(id);
  if (!r) return <Sub>Cette recette n’existe plus.</Sub>;
  const put = (kk: string) => {
    set((s) => ({ plan: { ...s.plan, [kk]: r.id } }));
    onDone();
    toast(`${r.n} : ${slotLabel(kk).toLowerCase()}`);
  };
  const remove = () =>
    Alert.alert('Supprimer la recette ?', `« ${r.n} » sera retirée de tes recettes et du menu.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteRecipe(r.id);
          onDone();
          toast('Recette supprimée');
        },
      },
    ]);
  const am = activeMeals(S);
  const staples = r.i.filter(([i]) => ingOf(i)[4] === 's');
  const main = r.i.filter(([i]) => ingOf(i)[4] !== 's');
  return (
    <>
      <Sub>
        {r.t} min, pour {S.persons} personne{S.persons > 1 ? 's' : ''}
        {r.custom ? ' · ma recette' : ''}
      </Sub>
      <H2 style={{ fontSize: 18 }}>Ingrédients</H2>
      {main.map(([i, q]) => {
        const has = S.fridge.includes(i);
        return (
          <View key={i} style={[st.ing, { borderBottomColor: c.line }]}>
            <Text style={{ color: has ? c.leaf : c.ink, fontSize: 16, flex: 1 }}>
              {has ? '✓ ' : ''}
              {ingOf(i)[0]}
            </Text>
            <Text style={{ color: has ? c.leaf : c.ink, fontSize: 16 }}>{fmt(i, scale(S, q))}</Text>
          </View>
        );
      })}
      {staples.length ? <Sub style={{ fontSize: 14, marginTop: 6 }}>Placard : {staples.map(([i]) => ingOf(i)[0].toLowerCase()).join(', ')}</Sub> : null}
      <H2 style={{ fontSize: 18 }}>Étapes</H2>
      {r.s.map((step, n) => (
        <View key={n} style={st.step}>
          <Text style={[st.stepNum, { color: c.accentInk, backgroundColor: c.accent }]}>{n + 1}</Text>
          <Text style={{ flex: 1, color: c.ink, fontSize: 16, lineHeight: 24 }}>{step}</Text>
        </View>
      ))}
      {r.src ? (
        <Pressable onPress={() => Linking.openURL(r.src!).catch(() => {})} accessibilityRole="link">
          <Text style={{ color: c.leaf, fontSize: 14, marginTop: 6 }} numberOfLines={1}>
            🔗 Recette d’origine
          </Text>
        </Pressable>
      ) : null}
      {k ? (
        <Btn kind="accent" full style={{ marginTop: 12 }} label={`Mettre au menu : ${slotLabel(k).toLowerCase()}`} onPress={() => put(k)} />
      ) : am.length ? (
        <>
          <H2 style={{ fontSize: 18 }}>Ajouter au menu</H2>
          <View style={st.grid}>
            {Array.from({ length: 7 }, (_, d) =>
              am.map((m) => {
                const kk = d + '-' + m;
                const v = S.plan[kk];
                const vr = v && v !== 'restes' ? recipeOf(v) : undefined;
                return (
                  <Pressable key={kk} onPress={() => put(kk)} style={[st.gridBtn, { borderColor: c.line, backgroundColor: c.surface }]} accessibilityRole="button">
                    <Text style={{ color: c.ink, fontSize: 14 }}>
                      {DS[d]} {MEALS[m].toLowerCase()}
                    </Text>
                    <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12 }}>
                      {v === 'restes' ? 'Restes' : vr ? vr.n : 'libre'}
                    </Text>
                  </Pressable>
                );
              }),
            )}
          </View>
        </>
      ) : null}
      {!k ? (
        <Row style={{ marginTop: 16 }}>
          {r.custom ? (
            <Btn kind="ghost" label="✏️ Modifier" onPress={() => openEditor(recipeToDraft(r), r.id)} />
          ) : (
            <Btn kind="ghost" label="✏️ Copier et modifier" onPress={() => openEditor({ ...recipeToDraft(r), n: r.n + ' (ma version)' })} />
          )}
          <Btn kind="ghost" label="📤 Partager" onPress={() => shareRecipes([r.id])} />
          {r.custom ? <Btn kind="ghost" label="🗑 Supprimer" onPress={remove} /> : null}
        </Row>
      ) : null}
    </>
  );
}

function TextBody({ text }: { text: string }) {
  const c = useColors();
  return (
    <>
      <Sub>Sélectionne le texte pour le copier.</Sub>
      <TextInput value={text} multiline editable={false} style={[st.search, { minHeight: 240, color: c.ink, backgroundColor: c.surface, borderColor: c.line }]} />
    </>
  );
}

const st = StyleSheet.create({
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginVertical: 6 },
  prow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  see: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12 },
  ing: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  step: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  stepNum: { width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '800', overflow: 'hidden', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridBtn: { width: '48.5%', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
});
