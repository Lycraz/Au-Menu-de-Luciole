import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DAYS, DS, MEALS } from '../data';
import { ingOf } from '../catalog';
import { buildLists, coverLabel, fmt, listText, tripByCategory } from '../logic';
import { useStore } from '../store';
import { useColors, type Colors } from '../theme';
import { useSheets } from '../components/sheets';
import { Btn, Card, H1, Row, Sub } from '../components/ui';
import { DrivePanel, DriveSearch } from '../components/Drive';

function Check({ on, c }: { on: boolean; c: Colors }) {
  return (
    <View style={[st.box, { borderColor: on ? c.leaf : c.muted, backgroundColor: on ? c.leaf : 'transparent' }]}>
      {on ? <Text style={{ color: c.surface, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}
    </View>
  );
}

export function ShopScreen() {
  const { S, set, toast } = useStore();
  const { openText } = useSheets();
  const c = useColors();
  const [draft, setDraft] = useState('');
  const { trips, warns } = buildLists(S);
  const any = trips.some((t) => Object.keys(t.items).length);
  const goWeek = () => set({ tab: 'semaine' });

  const addExtra = () => {
    const v = draft.trim();
    if (!v) return;
    set((s) => ({ extras: [...s.extras, { t: v, c: false }] }));
    setDraft('');
  };
  const copy = async () => {
    const t = listText(S);
    try {
      await Clipboard.setStringAsync(t);
      toast('Liste copiée');
    } catch {
      openText(t);
    }
  };

  const header = (
    <>
      <H1>Courses</H1>
      <Sub>
        Pour {S.persons} personne{S.persons > 1 ? 's' : ''}. On suppose que tu as déjà huile, sel, poivre, épices et bouillon.
      </Sub>
    </>
  );

  if (!trips.length)
    return (
      <View>
        {header}
        <View style={st.empty}>
          <Text style={{ fontSize: 44 }}>🛒</Text>
          <Sub style={{ textAlign: 'center' }}>Choisis tes jours de courses dans l’onglet Semaine.</Sub>
          <Btn label="Choisir mes jours" onPress={goWeek} />
        </View>
      </View>
    );

  return (
    <View>
      {header}
      {warns.length ? (
        <View style={[st.warn, { backgroundColor: c.warnSoft }]}>
          <Text style={{ color: c.warn, fontWeight: '800' }}>⚠️ Fraîcheur</Text>
          {warns.map((w, i) => (
            <Text key={i} style={{ color: c.warn, marginTop: 4 }}>
              {ingOf(w.id)[0]} pour « {w.r.n} » ({DS[w.d]} {MEALS[w.m].toLowerCase()}) : acheté {DAYS[w.s].toLowerCase()}, {w.gap} jours avant.
            </Text>
          ))}
          <Text style={{ color: c.warn, marginTop: 4 }}>Ajoute une course plus proche de ces repas, ou déplace-les juste après une course.</Text>
        </View>
      ) : null}

      {!any ? (
        <View style={st.empty}>
          <Text style={{ fontSize: 44 }}>📝</Text>
          <Sub style={{ textAlign: 'center' }}>Ta liste se remplit toute seule quand tu ajoutes des plats à ta semaine.</Sub>
          <Btn label="Planifier la semaine" onPress={goWeek} />
        </View>
      ) : null}

      {any ? <DrivePanel /> : null}

      {trips.map((t, i) => {
        if (!Object.keys(t.items).length) return null;
        return (
          <Card key={t.s} style={{ marginTop: 14 }}>
            <Text style={[st.h3, { color: c.ink }]}>🛒 {DAYS[t.s]}</Text>
            <Text style={{ color: c.muted, fontSize: 14, marginTop: 2 }}>
              {coverLabel(t)}
              {i === 0 && trips.length > 1 ? ', plus tout le placard de la semaine' : ''}
            </Text>
            {tripByCategory(t).map(([cat, label, its]) => (
              <View key={cat}>
                <Text style={[st.cat, { color: c.leaf }]}>{label}</Text>
                {its.map((it, j) => {
                  const g = ingOf(it.id);
                  const key = t.s + '-' + it.id;
                  const done = !!S.checked[key];
                  const days = [...it.days].sort((a, b) => a - b).map((d) => DS[d]).join(', ');
                  const tag = g[4] === 'j' ? 'le jour même' : g[2] <= 3 ? 'très frais' : null;
                  return (
                    <Pressable
                      key={it.id}
                      onPress={() => set((s) => ({ checked: { ...s.checked, [key]: !done } }))}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      style={[st.item, j < its.length - 1 && { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    >
                      <Check on={done} c={c} />
                      <View style={{ flex: 1, opacity: done ? 0.4 : 1 }}>
                        <Text style={{ color: c.ink, fontSize: 16, textDecorationLine: done ? 'line-through' : 'none' }}>
                          {g[0]}
                          {tag ? <Text style={{ color: c.leaf, fontSize: 12, fontWeight: '600' }}>{'  ' + tag}</Text> : null}
                        </Text>
                        {g[2] < 60 ? <Text style={{ color: c.muted, fontSize: 12 }}>pour {days}</Text> : null}
                      </View>
                      <Text style={{ color: c.ink, fontWeight: '600', opacity: done ? 0.4 : 1 }}>{fmt(it.id, it.q)}</Text>
                      {!done ? <DriveSearch name={g[0]} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Card>
        );
      })}

      <Card style={{ marginTop: 14 }}>
        <Text style={[st.h3, { color: c.ink }]}>✏️ Mes ajouts</Text>
        <Text style={{ color: c.muted, fontSize: 14, marginTop: 2 }}>Ce qui n’est pas dans les recettes : café, lessive, fruits…</Text>
        {S.extras.map((x, i) => (
          <View key={i} style={[st.item, { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.c }}
              onPress={() => set((s) => ({ extras: s.extras.map((e, k) => (k === i ? { ...e, c: !e.c } : e)) }))}
            >
              <Check on={x.c} c={c} />
              <Text style={{ flex: 1, color: c.ink, fontSize: 16, opacity: x.c ? 0.4 : 1, textDecorationLine: x.c ? 'line-through' : 'none' }}>{x.t}</Text>
            </Pressable>
            {!x.c ? <DriveSearch name={x.t} /> : null}
            <Pressable hitSlop={10} accessibilityLabel="Supprimer" onPress={() => set((s) => ({ extras: s.extras.filter((_, k) => k !== i) }))}>
              <Text style={{ color: c.muted, fontSize: 18, paddingHorizontal: 6 }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addExtra}
            submitBehavior="submit"
            returnKeyType="done"
            placeholder="Ajouter un article"
            placeholderTextColor={c.muted}
            style={[st.input, { color: c.ink, backgroundColor: c.bg, borderColor: c.line }]}
          />
          <Btn label="Ajouter" onPress={addExtra} />
        </View>
      </Card>

      {any ? (
        <Row style={{ marginTop: 18 }}>
          <Btn label="📋 Copier la liste" onPress={copy} />
          <Btn kind="ghost" label="Tout décocher" onPress={() => set((s) => ({ checked: {}, extras: s.extras.map((x) => ({ ...x, c: false })) }))} />
        </Row>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  warn: { borderRadius: 14, padding: 14, marginTop: 12 },
  h3: { fontSize: 20, fontWeight: '800' },
  cat: { fontWeight: '600', fontSize: 14, marginTop: 14, marginBottom: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
});
