import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RECIPES } from '../data';
import { allIngredientIds, ingOf } from '../catalog';
import { TAG_LABEL, filterRecipes, type Tag } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';
import { RecipeCard } from '../components/RecipeCard';
import { shareRecipes, useSheets } from '../components/sheets';
import { Btn, Chip, H1, Row, Sub } from '../components/ui';

type Filter = 'tout' | 'mes' | Tag;
const FILTERS: Filter[] = ['tout', 'mes', 'rapide', 'vege', 'poisson'];

export function RecipesScreen() {
  const { S, set } = useStore();
  const { openRecipe, openEditor, openImport } = useSheets();
  const c = useColors();
  const [filter, setFilter] = useState<Filter>('tout');
  const [q, setQ] = useState('');
  const [fridgeOpen, setFridgeOpen] = useState(S.fridge.length > 0);
  const list = filter === 'mes' ? filterRecipes(S, 'tout', q).filter((r) => r.custom) : filterRecipes(S, filter, q);
  const ingSorted = allIngredientIds()
    .filter((id) => ingOf(id)[4] !== 's')
    .sort((a, b) => ingOf(a)[0].localeCompare(ingOf(b)[0]));

  return (
    <View>
      <H1>Recettes</H1>
      <Sub>
        {RECIPES.length} plats simples{S.myRecipes.length ? ` et ${S.myRecipes.length} recette${S.myRecipes.length > 1 ? 's' : ''} à toi` : ''}.
      </Sub>
      <Row style={{ marginTop: 12 }}>
        <Btn kind="accent" label="➕ Créer" onPress={() => openEditor()} />
        <Btn kind="ghost" label="📥 Importer" onPress={openImport} />
      </Row>
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
          <Chip key={f} label={f === 'tout' ? 'Tout' : f === 'mes' ? '⭐ Mes recettes' : TAG_LABEL[f]} on={filter === f} onPress={() => setFilter(f)} />
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
              {ingSorted.map((id) => (
                <Chip
                  key={id}
                  label={ingOf(id)[0]}
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
          <Sub style={{ textAlign: 'center', paddingVertical: 40 }}>
            {filter === 'mes' && !S.myRecipes.length ? 'Tu n’as pas encore de recette à toi. Crée-en une ou importe-la.' : 'Aucun plat ne correspond. Essaie un autre mot ou retire un filtre.'}
          </Sub>
        )}
      </View>
      {filter === 'mes' && S.myRecipes.length > 1 ? (
        <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
          <Btn kind="ghost" label="📤 Partager toutes mes recettes" onPress={() => shareRecipes(S.myRecipes.map((r) => r.id))} />
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginVertical: 10 },
  fridge: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12 },
});
