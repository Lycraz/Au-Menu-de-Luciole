import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Recipe } from '../data';
import { TAG_LABEL, fridgeMatches, tags } from '../logic';
import { useStore } from '../store';
import { useColors } from '../theme';

export function RecipeCard({ r, onPress, bad, compact, style }: { r: Recipe; onPress: () => void; bad?: string; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const { S } = useStore();
  const fr = fridgeMatches(S, r);
  const meta = compact ? `${r.t} min` : `${r.t} min` + tags(r).map((t) => ', ' + TAG_LABEL[t].slice(2).trim().toLowerCase()).join('');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [st.card, { backgroundColor: c.surface, borderColor: c.line, opacity: pressed ? 0.8 : 1 }, style]}
    >
      <Text style={st.em}>{r.e}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>{r.n}</Text>
        <Text style={{ color: c.muted, fontSize: 13 }}>{meta}</Text>
        {!compact && S.fridge.length ? (
          <Text style={{ color: c.leaf, fontSize: 13, fontWeight: '600' }}>
            Tu as {fr} ingrédient{fr > 1 ? 's' : ''} sur {r.i.length}
          </Text>
        ) : null}
        {bad ? <Text style={{ color: c.warn, fontSize: 12 }}>{bad}</Text> : null}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  em: { fontSize: 30, width: 44, textAlign: 'center' },
});
