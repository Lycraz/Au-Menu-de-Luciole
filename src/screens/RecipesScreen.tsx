import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ING, RECIPES } from '../data';
import { TAG_LABEL, filterRecipes, type Tag } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';
import { RecipeCard } from '../components/RecipeCard';
import { useSheets } from '../components/sheets';
import { Chip, H1, Row, Sub } from '../components/ui';

type Filter = 'tout' | Tag;
const FILTERS: Filter[] = ['tout', 'rapide', 'vege', 'poisson'];
const ING_SORTED = Object.keys(ING).sort((a, b) => ING[a][0].localeCompare(ING[b][0]));

export function RecipesScreen() {
  const { S, set } = useStore();
  const { openRecipe } = useSheets();
  const c = useColors();
  const [filter, setFilter] = useState<Filter>('tout');
  const [q, setQ] = useState('');
  const [fridgeOpen, setFridgeOpen] = useState(S.fridge.length > 0);
  const list = filterRecipes(S, filter, q);

  return (
    <View>
      <H1>Recettes</H1>
      <Sub>{RECIPES.length} plats simples, pour tous les soirs.</Sub>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Chercher un plat"
        placeholderTextColor={c.muted}
        clearButtonMode="while-editing"
        style={[st.search, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
      />
      <Row style={{ gap: 6 }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f === 'tout' ? 'Tout' : TAG_LABEL[f]} on={filter === f} onPress={() => setFilter(f)} />
        ))}
      </Row>

      <View style={[st.fridge, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Pressable onPress={() => setFridgeOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: fridgeOpen }} style={{ flexDirection: 'row' }}>
          <Text style={{ flex: 1, color: c.ink, fontWeight: '600', fontSize: 16 }}>
            🧊 Ce que j’ai déjà{S.fridge.length ? ` (${S.fridge.length})` : ''}
          </Text>
          <Text style={{ color: c.muted }}>{fridgeOpen ? '▲' : '▼'}</Text>
        </Pressable>
        {fridgeOpen ? (
          <>
            <Sub style={{ fontSize: 13, marginVertical: 8 }}>Coche ce qu’il te reste : les plats qui l’utilisent passent en premier.</Sub>
            <Row style={{ gap: 6 }}>
              {ING_SORTED.map((id) => (
                <Chip
                  key={id}
                  label={ING[id][0]}
                  on={S.fridge.includes(id)}
                  onPress={() => set((s) => ({ fridge: s.fridge.includes(id) ? s.fridge.filter((x) => x !== id) : [...s.fridge, id] }))}
                />
              ))}
            </Row>
            {S.fridge.length ? (
              <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                <Chip label="Tout retirer" onPress={() => set({ fridge: [] })} />
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={{ gap: 8, marginTop: 12 }}>
        {list.length ? (
          list.map((r) => <RecipeCard key={r.id} r={r} onPress={() => openRecipe(r.id)} />)
        ) : (
          <Sub style={{ textAlign: 'center', paddingVertical: 40 }}>Aucun plat ne correspond. Essaie un autre mot ou retire un filtre.</Sub>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginVertical: 10 },
  fridge: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12 },
});
