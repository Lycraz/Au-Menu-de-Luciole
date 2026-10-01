// Logique pure : planning, fraîcheur, listes de courses. Aucune dépendance React.
import { CATS, DAYS, DS, FISH, MEALS, MEAL_KEYS, type CatKey, type Ingredient, type MealKey, type Recipe } from './data';
import { allRecipes, ingOf, isStaple, recipeOf } from './catalog';

export type Tab = 'semaine' | 'courses' | 'recettes';
export type Extra = { t: string; c: boolean };
export type AppState = {
  persons: number;
  shop: number[];
  meals: Record<MealKey, boolean>;
  /** clé "jour-repas" (ex. "0-soir") -> id de recette ou "restes" */
  plan: Record<string, string>;
  checked: Record<string, boolean>;
  extras: Extra[];
  fridge: string[];
  tab: Tab;
  /** Recettes créées ou importées */
  myRecipes: Recipe[];
  /** Ingrédients inconnus du catalogue, ajoutés par les recettes perso (id "u:…") */
  myIng: Record<string, Ingredient>;
  drive: DriveSettings;
};

export type DriveKey = 'leclerc' | 'carrefour' | 'auchan' | 'intermarche' | 'autre';
export type DriveSettings = { store: DriveKey | null; leclercUrl: string; customUrl: string };

export const DEFAULT_STATE: AppState = {
  persons: 2,
  shop: [0, 3],
  meals: { midi: false, soir: true },
  plan: {},
  checked: {},
  extras: [],
  fridge: [],
  tab: 'semaine',
  myRecipes: [],
  myIng: {},
  drive: { store: null, leclercUrl: '', customUrl: '' },
};

export const sortedShop = (S: AppState) => [...S.shop].sort((a, b) => a - b);
export const activeMeals = (S: AppState) => MEAL_KEYS.filter((m) => S.meals[m]);
export const scale = (S: AppState, q: number) => (q * S.persons) / 2;
export const slotLabel = (k: string) => {
  const [d, m] = k.split('-');
  return DAYS[+d] + ' ' + MEALS[m as MealKey].toLowerCase();
};
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Dernière course avant (ou le jour de) `d`, et nombre de jours écoulés. */
export function lastTrip(S: AppState, d: number): { s: number; gap: number } | null {
  const sh = sortedShop(S);
  if (!sh.length) return null;
  const before = sh.filter((s) => s <= d);
  if (before.length) {
    const s = before[before.length - 1];
    return { s, gap: d - s };
  }
  const s = sh[sh.length - 1];
  return { s, gap: d + 7 - s };
}

/** La recette tient-elle la route côté fraîcheur si on la mange le jour `d` ? */
export function fits(S: AppState, r: Recipe, d: number): boolean {
  const lt = lastTrip(S, d);
  if (!lt) return true;
  return r.i.every(([id]) => {
    const g = ingOf(id);
    return g[4] === 'j' || g[4] === 's' || g[2] >= 60 || g[2] >= lt.gap;
  });
}

export type Tag = 'rapide' | 'vege' | 'poisson';
export const TAG_LABEL: Record<Tag, string> = { rapide: '⚡ Rapide', vege: '🌱 Végé', poisson: '🐟 Poisson' };
export function tags(r: Recipe): Tag[] {
  const t: Tag[] = [];
  if (r.t <= 15) t.push('rapide');
  if (!r.i.some(([id]) => ingOf(id)[4] === 'm')) t.push('vege');
  if (r.i.some(([id]) => FISH.includes(id))) t.push('poisson');
  return t;
}

export function fmt(id: string, q: number): string {
  const u = ingOf(id)[3];
  if (u === 'g') return q >= 1000 ? (Math.round(q / 100) / 10 + ' kg').replace('.', ',') : Math.max(10, Math.round(q / 10) * 10) + ' g';
  if (u === 'cl') return Math.round(q) + ' cl';
  if (u === 'c. à s.' || u === 'c. à c.') {
    const v = Math.round(q * 2) / 2;
    return String(v).replace('.', ',') + ' ' + u;
  }
  const n = Math.ceil(q - 0.001);
  if (u === 'pc') return String(n);
  if (/[ .]/.test(u) || /[sx]$/.test(u)) return n + ' ' + u;
  return n + ' ' + u + (n > 1 ? 's' : '');
}

export type PlanEntry = { d: number; m: MealKey; r: Recipe; k: string };
export function planEntries(S: AppState): PlanEntry[] {
  const out: PlanEntry[] = [];
  for (let d = 0; d < 7; d++)
    for (const m of activeMeals(S)) {
      const k = d + '-' + m;
      const r = S.plan[k];
      const rec = r ? recipeOf(r) : undefined;
      if (rec) out.push({ d, m, r: rec, k });
    }
  return out;
}

export type TripItem = { id: string; q: number; days: number[] };
export type Trip = { s: number; cover: number[]; items: Record<string, TripItem> };
export type FreshWarning = { id: string; r: Recipe; d: number; m: MealKey; s: number; gap: number };

export function buildLists(S: AppState): { trips: Trip[]; warns: FreshWarning[] } {
  const sh = sortedShop(S);
  const warns: FreshWarning[] = [];
  if (!sh.length) return { trips: [], warns };
  const trips: Record<number, Trip> = {};
  sh.forEach((s, i) => {
    const cover: number[] = [];
    const next = sh[(i + 1) % sh.length];
    let d = s;
    do {
      cover.push(d);
      d = (d + 1) % 7;
    } while (d !== next && cover.length < 7);
    trips[s] = { s, cover, items: {} };
  });
  for (const { d, m, r } of planEntries(S)) {
    const lt = lastTrip(S, d)!;
    for (const [id, q] of r.i) {
      if (isStaple(id)) continue;
      const g = ingOf(id);
      const long = g[2] >= 60;
      const s = long ? sh[0] : lt.s;
      if (!long && g[4] !== 'j' && lt.gap > g[2]) warns.push({ id, r, d, m, s: lt.s, gap: lt.gap });
      const it = trips[s].items[id] || (trips[s].items[id] = { id, q: 0, days: [] });
      it.q += scale(S, q);
      if (!it.days.includes(d)) it.days.push(d);
    }
  }
  return { trips: sh.map((s) => trips[s]), warns };
}

export const warnKeys = (S: AppState) => new Set(buildLists(S).warns.map((w) => w.d + '-' + w.m));

/** Articles d'une course, regroupés par rayon et triés par nom. */
export function tripByCategory(t: Trip): [CatKey, string, TripItem[]][] {
  const out: [CatKey, string, TripItem[]][] = [];
  for (const [c, label] of CATS) {
    const its = Object.values(t.items)
      .filter((it) => ingOf(it.id)[1] === c)
      .sort((a, b) => ingOf(a.id)[0].localeCompare(ingOf(b.id)[0]));
    if (its.length) out.push([c, label, its]);
  }
  return out;
}

export function pickRandom(S: AppState, d: number, used: Set<string>, rand = Math.random): string {
  let c = allRecipes().filter((r) => !used.has(r.id) && fits(S, r, d));
  if (!c.length) c = allRecipes().filter((r) => fits(S, r, d));
  if (!c.length) c = allRecipes();
  return c[Math.floor(rand() * c.length)].id;
}

/** Remplit tous les repas vides. Renvoie le nouveau plan et le nombre de repas ajoutés. */
export function fillEmpty(S: AppState, rand = Math.random): { plan: Record<string, string>; added: number } {
  const plan = { ...S.plan };
  const used = new Set(Object.values(plan));
  let added = 0;
  for (let d = 0; d < 7; d++)
    for (const m of activeMeals(S)) {
      const k = d + '-' + m;
      if (!plan[k]) {
        const id = pickRandom(S, d, used, rand);
        plan[k] = id;
        used.add(id);
        added++;
      }
    }
  return { plan, added };
}

export const fridgeMatches = (S: AppState, r: Recipe) => S.fridge.filter((id) => r.i.some(([x]) => x === id)).length;

export function filterRecipes(S: AppState, filter: 'tout' | Tag, q: string): Recipe[] {
  let list = allRecipes().filter((r) => (filter === 'tout' || tags(r).includes(filter)) && r.n.toLowerCase().includes(q.toLowerCase()));
  if (S.fridge.length)
    list = list
      .map((r) => [r, fridgeMatches(S, r) / r.i.length] as const)
      .sort((a, b) => b[1] - a[1])
      .map((x) => x[0]);
  return list;
}

export function listText(S: AppState): string {
  const { trips } = buildLists(S);
  let t = '';
  for (const tr of trips) {
    if (!Object.keys(tr.items).length) continue;
    t += `🛒 ${DAYS[tr.s]}\n`;
    for (const [, l, its] of tripByCategory(tr)) t += `${l}\n` + its.map((it) => `- ${ingOf(it.id)[0]} : ${fmt(it.id, it.q)}`).join('\n') + '\n';
    t += '\n';
  }
  const ex = S.extras.filter((x) => !x.c);
  if (ex.length) t += '✏️ Mes ajouts\n' + ex.map((x) => '- ' + x.t).join('\n');
  return t.trim();
}

export const coverLabel = (t: Trip) =>
  t.cover.length > 1 ? `pour les repas du ${DS[t.cover[0]]} au ${DS[t.cover[t.cover.length - 1]]}` : `pour les repas du ${DS[t.cover[0]]}`;
