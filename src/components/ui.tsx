import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useColors } from '../theme';

export function H1({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[s.h2, { color: c.ink }, style]} accessibilityRole="header">{children}</Text>;
}
export function Sub({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[s.sub, { color: c.muted }, style]}>{children}</Text>;
}

type BtnKind = 'dark' | 'accent' | 'ghost';
export function Btn({ label, onPress, kind = 'dark', full, style }: { label: string; onPress: () => void; kind?: BtnKind; full?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const bg = kind === 'dark' ? c.ink : kind === 'accent' ? c.accent : 'transparent';
  const fg = kind === 'dark' ? c.bg : kind === 'accent' ? c.accentInk : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: kind === 'ghost' ? c.line : bg, opacity: pressed ? 0.75 : 1 }, full && { alignSelf: 'stretch' }, style]}
    >
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[s.chip, { backgroundColor: on ? c.ink : c.surface, borderColor: on ? c.ink : c.line }]}
    >
      <Text style={{ color: on ? c.bg : c.ink, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>{children}</View>;
}

/** Feuille modale qui monte du bas (pageSheet sur iOS/iPad). */
export function Sheet({ visible, onClose, title, icon, children, scrollKey }: { visible: boolean; onClose: () => void; title: string; icon?: string; children: ReactNode; scrollKey?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.sheetHead, { borderBottomColor: c.line }]}>
          {icon ? <Text style={{ fontSize: 34 }}>{icon}</Text> : null}
          <Text style={[s.sheetTitle, { color: c.ink }]} accessibilityRole="header">{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={12} style={s.close}>
            <Text style={{ color: c.muted, fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>
        <ScrollView key={scrollKey} contentContainerStyle={[s.sheetBody, { paddingBottom: 24 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const s = StyleSheet.create({
  h1: { fontSize: 38, fontWeight: '800', letterSpacing: -1, lineHeight: 42, marginTop: 4, marginBottom: 6 },
  h2: { fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 21 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, alignItems: 'center' },
  btnText: { fontWeight: '600', fontSize: 15 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { flex: 1, fontSize: 22, fontWeight: '800', lineHeight: 26 },
  close: { padding: 4 },
  sheetBody: { padding: 16, gap: 8 },
});
