import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { DS, MEALS, RBY } from '../data';
import { activeMeals, capitalize, fillEmpty, planEntries, sortedShop, warnKeys } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';
import { useSheets } from '../components/sheets';
import { Btn, H1, Row, Sub } from '../components/ui';

export function WeekScreen() {
  const { S, set, toast } = useStore();
  const { openPicker } = useSheets();
  const c = useColors();
  const am = activeMeals(S);
  const wk = warnKeys(S);
  const planned = planEntries(S).length;
  const hasShop = sortedShop(S).length > 0;

  const toggleShop = (d: number) => set((s) => ({ shop: s.shop.includes(d) ? s.shop.filter((x) => x !== d) : [...s.shop, d] }));
  const fill = () => {
    const { plan, added } = fillEmpty(S);
    set({ plan });
    toast(added ? `${added} repas ajoutés` : 'Tous les repas sont déjà prévus');
  };
  const clearWeek = () =>
    Alert.alert('Tout effacer ?', 'Effacer tous les repas de la semaine ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => set({ plan: {}, checked: {} }) },
    ]);

  return (
    <View>
      <H1>Au Menu de Luciole</H1>
      <Sub>{planned ? `${planned} repas prévus cette semaine` : 'Ta semaine est vide pour l’instant.'}</Sub>

      <View style={st.strip} accessibilityLabel="Jours de courses">
        {DS.map((d, i) => {
          const on = S.shop.includes(i);
          return (
            <Pressable
              key={d}
              onPress={() => toggleShop(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Courses le ${d}`}
              style={[st.dot, on ? { backgroundColor: c.accent, borderColor: c.accent, borderStyle: 'solid', transform: [{ scale: 1.06 }] } : { borderColor: c.line }]}
            >
              <Text style={{ fontSize: 14, height: 18 }}>{on ? '🛒' : ''}</Text>
              <Text style={{ fontWeight: '600', fontSize: 13, color: on ? c.accentInk : c.ink }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <Sub style={{ fontSize: 13, marginBottom: 14 }}>{hasShop ? 'Touche un jour pour ajouter ou retirer une course.' : 'Touche au moins un jour pour choisir quand tu fais les courses.'}</Sub>

      <Row style={{ alignItems: 'center' }}>
        <View style={[st.pill, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={{ color: c.ink, fontSize: 15 }}>👥 {S.persons} pers.</Text>
          <Pressable style={[st.step, { backgroundColor: c.bg }]} accessibilityLabel="Une personne de moins" onPress={() => set((s) => ({ persons: Math.max(1, s.persons - 1) }))}>
            <Text style={[st.stepTxt, { color: c.ink }]}>−</Text>
          </Pressable>
          <Pressable style={[st.step, { backgroundColor: c.bg }]} accessibilityLabel="Une personne de plus" onPress={() => set((s) => ({ persons: Math.min(12, s.persons + 1) }))}>
            <Text style={[st.stepTxt, { color: c.ink }]}>+</Text>
          </Pressable>
        </View>
        {(Object.keys(MEALS) as (keyof typeof MEALS)[]).map((m) => {
          const on = S.meals[m];
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => set((s) => ({ meals: { ...s.meals, [m]: !s.meals[m] } }))}
              style={[st.tog, { backgroundColor: on ? c.leaf : c.surface, borderColor: on ? c.leaf : c.line }]}
            >
              <Text style={{ color: on ? c.surface : c.ink, fontSize: 15 }}>{MEALS[m]}</Text>
            </Pressable>
          );
        })}
      </Row>

      <Row style={{ marginTop: 18, marginBottom: 4 }}>
        <Btn kind="accent" label="🎲 Remplir les repas vides" onPress={fill} />
        {planned ? <Btn kind="ghost" label="Tout effacer" onPress={clearWeek} /> : null}
      </Row>

      {!am.length ? (
        <View style={st.empty}>
          <Text style={{ fontSize: 44 }}>🍽️</Text>
          <Sub style={{ textAlign: 'center' }}>Active le midi ou le soir pour planifier tes repas.</Sub>
        </View>
      ) : (
        DS.map((dn, d) => (
          <View key={dn} style={[st.day, { borderTopColor: c.line }]}>
            <View style={{ width: 64, paddingTop: 10 }}>
              <Text style={{ fontWeight: '800', fontSize: 17, color: c.ink }}>{capitalize(dn)}</Text>
              {S.shop.includes(d) ? <Text style={[st.cart, { backgroundColor: c.accent, color: c.accentInk }]}>courses</Text> : null}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              {am.map((m) => {
                const k = d + '-' + m;
                const v = S.plan[k];
                const r = v && v !== 'restes' ? RBY[v] : undefined;
                const empty = !v || (v !== 'restes' && !r);
                return (
                  <Pressable
                    key={k}
                    onPress={() => openPicker(k)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      st.slot,
                      empty ? { borderStyle: 'dashed', borderColor: c.line } : { backgroundColor: c.surface, borderColor: c.line },
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={[st.meal, { color: c.muted }]}>{MEALS[m]}</Text>
                    {empty ? (
                      <Text style={{ flex: 1, color: c.muted, fontWeight: '600' }}>+ Choisir un plat</Text>
                    ) : (
                      <>
                        <Text style={{ fontSize: 20 }}>{v === 'restes' ? '🥡' : r!.e}</Text>
                        <Text style={{ flex: 1, color: c.ink, fontWeight: '600', fontSize: 15 }}>{v === 'restes' ? 'Restes' : r!.n}</Text>
                        {wk.has(k) ? <Text accessibilityLabel="Produit frais acheté trop tôt">⚠️</Text> : null}
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const st = StyleSheet.create({
  strip: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 20, marginBottom: 8 },
  dot: { flex: 1, aspectRatio: 1, maxWidth: 64, borderRadius: 999, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingLeft: 14, paddingRight: 6 },
  step: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 18, fontWeight: '800' },
  tog: { borderWidth: 1, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  day: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  cart: { fontSize: 11, fontWeight: '600', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginTop: 4, alignSelf: 'flex-start', overflow: 'hidden' },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, minHeight: 50 },
  meal: { fontSize: 12, minWidth: 34 },
});
