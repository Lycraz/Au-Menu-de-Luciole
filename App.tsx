import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetProvider } from './src/components/sheets';
import { buildLists, type Tab } from './src/logic';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { WeekScreen } from './src/screens/WeekScreen';
import { StoreProvider, useStore } from './src/store';
import { useColors } from './src/theme';

const TABS: [Tab, string, string][] = [
  ['semaine', '📅', 'Semaine'],
  ['courses', '🛒', 'Courses'],
  ['recettes', '🍳', 'Recettes'],
];

function Shell() {
  const { S, set, ready, toastMsg } = useStore();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const warnCount = buildLists(S).warns.length;

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [S.tab]);

  if (!ready)
    return (
      <View style={[st.fill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={c.leaf} />
      </View>
    );

  return (
    <View style={[st.fill, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={st.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 32, paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right }}
        >
          <View style={st.wrap}>
            {S.tab === 'semaine' ? <WeekScreen /> : S.tab === 'courses' ? <ShopScreen /> : <RecipesScreen />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {toastMsg ? (
        <View pointerEvents="none" style={[st.toast, { backgroundColor: c.ink, bottom: insets.bottom + 80 }]} accessibilityLiveRegion="polite">
          <Text style={{ color: c.bg, fontSize: 15 }}>{toastMsg}</Text>
        </View>
      ) : null}

      <View style={[st.nav, { backgroundColor: c.surface, borderTopColor: c.line, paddingBottom: insets.bottom }]} accessibilityRole="tablist">
        <View style={[st.wrap, { flexDirection: 'row' }]}>
          {TABS.map(([k, icon, label]) => {
            const on = S.tab === k;
            return (
              <Pressable key={k} style={st.tab} onPress={() => set({ tab: k })} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                <Text style={{ fontSize: 22, transform: [{ scale: on ? 1.12 : 1 }] }}>{icon}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: on ? c.ink : c.muted }}>{label}</Text>
                  {k === 'courses' && warnCount ? (
                    <Text style={[st.badge, { backgroundColor: c.warn }]}>{warnCount}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SheetProvider>
          <Shell />
          <StatusBar style="auto" />
        </SheetProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  wrap: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  nav: { borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 10 },
  badge: { color: '#fff', fontSize: 10, fontWeight: '700', borderRadius: 8, paddingHorizontal: 5, overflow: 'hidden' },
  toast: { position: 'absolute', alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
});
