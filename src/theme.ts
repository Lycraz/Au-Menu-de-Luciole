import { useColorScheme } from 'react-native';

const light = {
  bg: '#EEF2EA',
  surface: '#FFFFFF',
  ink: '#1E3328',
  muted: '#5B6E62',
  line: '#D5DDD0',
  accent: '#E9A92B',
  accentInk: '#3A2900',
  leaf: '#2F6B4A',
  leafSoft: '#DCEBDF',
  warn: '#B8432C',
  warnSoft: '#F8E3DC',
};
export type Colors = typeof light;

const dark: Colors = {
  bg: '#111915',
  surface: '#1A241E',
  ink: '#E6EEE8',
  muted: '#9AAC9F',
  line: '#2B3A31',
  accent: '#F0B640',
  accentInk: '#2A1D00',
  leaf: '#7CC69A',
  leafSoft: '#20382A',
  warn: '#F08A70',
  warnSoft: '#3A221C',
};

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
