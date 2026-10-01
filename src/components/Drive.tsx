import { useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { DRIVES, driveCanSearch, driveInfo, driveUrl } from '../drive';
import { useStore } from '../store';
import { useColors } from '../theme';
import { Btn, Card, Chip, Row, Sub } from './ui';

export function openDrive(url: string | null, toast: (m: string) => void) {
  if (!url) {
    toast('Choisis d’abord ton drive');
    return;
  }
  Linking.openURL(url).catch(() => toast('Impossible d’ouvrir le site du drive'));
}

/** Choix de l'enseigne et réglages, en haut de la liste de courses. */
export function DrivePanel() {
  const { S, set, toast } = useStore();
  const c = useColors();
  const d = S.drive;
  const info = driveInfo(d.store);
  const [open, setOpen] = useState(!d.store);
  const setDrive = (p: Partial<typeof d>) => set((s) => ({ drive: { ...s.drive, ...p } }));
  const input = { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: c.ink, backgroundColor: c.bg, borderColor: c.line, marginTop: 8 } as const;

  return (
    <Card style={{ marginTop: 14 }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={{ flex: 1, color: c.ink, fontSize: 20, fontWeight: '800' }}>🚗 Drive{info ? ` : ${info.name}` : ''}</Text>
        <Text style={{ color: c.muted }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {!open ? (
        d.store ? (
          <Sub style={{ fontSize: 14, marginTop: 4 }}>
            {driveCanSearch(d) ? 'Touche 🔎 à côté d’un article pour le chercher, ajoute-le au panier, puis coche-le ici.' : 'Réglage incomplet : touche pour terminer.'}
          </Sub>
        ) : null
      ) : (
        <>
          <Sub style={{ fontSize: 14, marginTop: 4 }}>Choisis ton enseigne. Un bouton 🔎 apparaît à côté de chaque article pour le chercher directement dans le drive.</Sub>
          <Row style={{ gap: 6, marginTop: 10 }}>
            <Chip label="Aucun" on={!d.store} onPress={() => setDrive({ store: null })} />
            {DRIVES.map((x) => (
              <Chip key={x.key} label={x.name} on={d.store === x.key} onPress={() => setDrive({ store: x.key })} />
            ))}
          </Row>
          {info?.note ? <Sub style={{ fontSize: 13, marginTop: 10 }}>{info.note}</Sub> : null}
          {d.store === 'leclerc' ? (
            <>
              <TextInput
                value={d.leclercUrl}
                onChangeText={(v) => setDrive({ leclercUrl: v })}
                placeholder="https://fdXX-courses.leclercdrive.fr/magasin-…"
                placeholderTextColor={c.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={input}
              />
              {d.leclercUrl && !driveCanSearch(d) ? <Text style={{ color: c.warn, fontSize: 13, marginTop: 4 }}>Cette adresse ne ressemble pas à une page de magasin Leclerc Drive.</Text> : null}
              <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Btn kind="ghost" label="Trouver mon magasin" onPress={() => openDrive('https://www.leclercdrive.fr/', toast)} />
              </View>
            </>
          ) : null}
          {d.store === 'autre' ? (
            <TextInput
              value={d.customUrl}
              onChangeText={(v) => setDrive({ customUrl: v })}
              placeholder="https://exemple.fr/recherche?q={q}"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={input}
            />
          ) : null}
          {d.store ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              <Btn label="OK" onPress={() => setOpen(false)} />
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

/** Petit bouton 🔎 qui cherche l'article dans le drive choisi. */
export function DriveSearch({ name }: { name: string }) {
  const { S, toast } = useStore();
  const c = useColors();
  if (!S.drive.store) return null;
  return (
    <Pressable
      onPress={() => openDrive(driveUrl(S.drive, name), toast)}
      hitSlop={6}
      accessibilityRole="link"
      accessibilityLabel={`Chercher ${name} dans le drive`}
      style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 6 }}
    >
      <Text style={{ fontSize: 15 }}>🔎</Text>
    </Pressable>
  );
}
