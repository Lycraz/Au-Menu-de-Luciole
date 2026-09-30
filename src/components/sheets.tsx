import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DS, ING, MEALS, RBY, RECIPES } from '../data';
import { activeMeals, fits, fmt, pickRandom, scale, slotLabel } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';
import { RecipeCard } from './RecipeCard';
import { Btn, H2, Row, Sheet, Sub } from './ui';

type SheetState = { type: 'picker'; k: string } | { type: 'recipe'; id: string; k?: string } | { type: 'text'; text: string } | null;
type SheetApi = { openPicker: (k: string) => void; openRecipe: (id: string, k?: string) => void; openText: (text: string) => void; close: () => void };

const Ctx = createContext<SheetApi | null>(null);
export const useSheets = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSheets hors de SheetProvider');
  return v;
};

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
  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Une seule Modal dont le contenu change : iOS n'aime pas enchaîner deux Modals. */}
      <Sheet
        visible={!!sheet}
        onClose={sheet?.type === 'recipe' ? closeOrBack : api.close}
        title={sheet?.type === 'picker' ? slotLabel(sheet.k) : sheet?.type === 'recipe' ? RBY[sheet.id]?.n ?? '' : 'Ta liste'}
        icon={sheet?.type === 'recipe' ? RBY[sheet.id]?.e : undefined}
      >
        {sheet?.type === 'picker' && <PickerBody key={sheet.k} k={sheet.k} onClose={api.close} />}
        {sheet?.type === 'recipe' && <RecipeBody id={sheet.id} k={sheet.k} onDone={api.close} />}
        {sheet?.type === 'text' && <TextBody text={sheet.text} />}
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
  const rows = RECIPES.filter((r) => r.n.toLowerCase().includes(q.toLowerCase()))
    .map((r) => [r, fits(S, r, d)] as const)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const put = (id: string) => {
    set((s) => ({ plan: { ...s.plan, [k]: id } }));
    onClose();
    if (RBY[id]) toast(`${RBY[id].n} : ${slotLabel(k).toLowerCase()}`);
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
  const { S, set, toast } = useStore();
  const c = useColors();
  const r = RBY[id];
  if (!r) return null;
  const put = (kk: string) => {
    set((s) => ({ plan: { ...s.plan, [kk]: r.id } }));
    onDone();
    toast(`${r.n} : ${slotLabel(kk).toLowerCase()}`);
  };
  const am = activeMeals(S);
  return (
    <>
      <Sub>
        {r.t} min, pour {S.persons} personne{S.persons > 1 ? 's' : ''}
      </Sub>
      <H2 style={{ fontSize: 18 }}>Ingrédients</H2>
      {r.i.map(([i, q]) => {
        const has = S.fridge.includes(i);
        return (
          <View key={i} style={[st.ing, { borderBottomColor: c.line }]}>
            <Text style={{ color: has ? c.leaf : c.ink, fontSize: 16 }}>
              {has ? '✓ ' : ''}
              {ING[i][0]}
            </Text>
            <Text style={{ color: has ? c.leaf : c.ink, fontSize: 16 }}>{fmt(i, scale(S, q))}</Text>
          </View>
        );
      })}
      <H2 style={{ fontSize: 18 }}>Étapes</H2>
      {r.s.map((step, n) => (
        <View key={n} style={st.step}>
          <Text style={[st.stepNum, { color: c.accentInk, backgroundColor: c.accent }]}>{n + 1}</Text>
          <Text style={{ flex: 1, color: c.ink, fontSize: 16, lineHeight: 24 }}>{step}</Text>
        </View>
      ))}
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
                return (
                  <Pressable key={kk} onPress={() => put(kk)} style={[st.gridBtn, { borderColor: c.line, backgroundColor: c.surface }]} accessibilityRole="button">
                    <Text style={{ color: c.ink, fontSize: 14 }}>
                      {DS[d]} {MEALS[m].toLowerCase()}
                    </Text>
                    <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12 }}>
                      {v === 'restes' ? 'Restes' : v && RBY[v] ? RBY[v].n : 'libre'}
                    </Text>
                  </Pressable>
                );
              }),
            )}
          </View>
        </>
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
  ing: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  step: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  stepNum: { width: 24, height: 24, borderRadius: 12, textAlign: 'center', lineHeight: 24, fontWeight: '800', overflow: 'hidden', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridBtn: { width: '48.5%', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
});
