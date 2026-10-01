// Mode drive guidé : pour chaque article, un lien ouvre la recherche dans l'enseigne choisie.
// Les enseignes n'offrent pas d'accès public pour remplir un panier : l'utilisateur ajoute lui-même.
import type { DriveKey, DriveSettings } from './logic';

export type DriveInfo = { key: DriveKey; name: string; home: string; search?: (q: string) => string; note?: string };

export const DRIVES: DriveInfo[] = [
  {
    key: 'leclerc',
    name: 'E.Leclerc Drive',
    home: 'https://www.leclercdrive.fr/',
    note: 'Leclerc a une adresse par magasin : colle celle de ton drive (page d’accueil de ton magasin) pour chercher directement dedans.',
  },
  { key: 'carrefour', name: 'Carrefour Drive', home: 'https://www.carrefour.fr/', search: (q) => `https://www.carrefour.fr/s?q=${q}` },
  { key: 'auchan', name: 'Auchan Drive', home: 'https://www.auchan.fr/', search: (q) => `https://www.auchan.fr/recherche?text=${q}` },
  { key: 'intermarche', name: 'Intermarché Drive', home: 'https://www.intermarche.com/', search: (q) => `https://www.intermarche.com/recherche/${q}` },
  { key: 'autre', name: 'Autre', home: '', note: 'Colle l’adresse d’une recherche sur le site de ton magasin, en remplaçant le mot cherché par {q}.' },
];
export const driveInfo = (k: DriveKey | null) => DRIVES.find((d) => d.key === k);

/** Terme de recherche simple : on retire ce qui gêne les moteurs des sites (surgelés, parenthèses…). */
export function searchTerm(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\bsurgel[ée]s?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Racine d'un magasin Leclerc Drive à partir de n'importe quelle page de ce magasin. */
export function leclercBase(url: string): string | null {
  const m = url.trim().match(/^(https?:\/\/[a-z0-9-]+\.leclercdrive\.fr\/magasin-[^/?#]+)/i);
  return m ? m[1] : null;
}

/** Adresse à ouvrir pour chercher `name`, ou la page d'accueil du drive si la recherche n'est pas possible. */
export function driveUrl(s: DriveSettings, name: string): string | null {
  const q = encodeURIComponent(searchTerm(name));
  switch (s.store) {
    case null:
      return null;
    case 'leclerc': {
      const base = leclercBase(s.leclercUrl);
      return base ? `${base}/recherche.aspx?TexteRecherche=${q}` : 'https://www.leclercdrive.fr/';
    }
    case 'autre': {
      const t = s.customUrl.trim();
      if (!/^https?:\/\//i.test(t)) return null;
      return t.includes('{q}') ? t.replace('{q}', q) : t;
    }
    default:
      return driveInfo(s.store)?.search?.(q) ?? null;
  }
}

/** Le lien mène-t-il bien à une recherche (et pas seulement à l'accueil) ? */
export function driveCanSearch(s: DriveSettings): boolean {
  if (s.store === 'leclerc') return !!leclercBase(s.leclercUrl);
  if (s.store === 'autre') return /^https?:\/\/.*\{q\}/i.test(s.customUrl.trim());
  return !!s.store;
}
