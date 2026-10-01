// Import de recettes : lien (JSON-LD schema.org), texte libre, partage entre téléphones.
// Tout passe par un « brouillon » (Draft) que l'utilisateur relit dans l'éditeur avant d'enregistrer.
import { CATS, ING, type CatKey, type Ingredient, type Recipe } from './data';
import { ingOf } from './catalog';

export type DraftIng = { name: string; qty: number | null; unit: string; cat?: CatKey };
export type Draft = { n: string; e: string; t: number; servings: number; ings: DraftIng[]; steps: string[]; src?: string };

export const UNITS = ['', 'g', 'cl', 'c. à s.', 'c. à c.', 'pincée', 'gousse', 'tranche', 'boîte', 'sachet', 'pot', 'botte', 'brin'];
export const EMOJIS = ['🍽️', '🍝', '🍛', '🥘', '🍲', '🥗', '🥣', '🍗', '🥩', '🐟', '🍳', '🥧', '🍕', '🍔', '🌯', '🍚', '🥔', '🧀', '🥕', '🍰'];
export const SHARE_TAG = '#aumenu ';

// ---------- Normalisation ----------
// Table maison plutôt que String.normalize (pas garanti sur tous les moteurs JS mobiles).
const ACC: Record<string, string> = {};
for (const [base, chars] of [['a', 'àáâãäå'], ['c', 'ç'], ['e', 'èéêë'], ['i', 'ìíîï'], ['n', 'ñ'], ['o', 'òóôõö'], ['u', 'ùúûü'], ['y', 'ýÿ']] as const)
  for (const ch of chars) ACC[ch] = base;
const deaccent = (s: string) => s.replace(/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/g, (ch) => ACC[ch]);

export function norm(s: string): string {
  return deaccent(s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae'))
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const singular = (w: string) => (w.length > 3 && /[sx]$/.test(w) && !/(ss|is|us|as)$/.test(w) ? w.slice(0, -1) : w);
export const normSing = (s: string) => norm(s).split(' ').map(singular).join(' ');
const slug = (s: string) => normSing(s).replace(/ /g, '-').slice(0, 40) || 'ingredient';

// ---------- Correspondance avec le catalogue ----------
// clé (normalisée, au singulier) -> id du catalogue ; null = ingrédient volontairement « inconnu »
const SYN: Record<string, string | null> = {
  oeuf: 'oeufs', 'jaune d oeuf': 'oeufs', 'blanc d oeuf': 'oeufs',
  oignon: 'oignon', 'oignon rouge': 'oignon', 'oignon jaune': 'oignon',
  ail: 'ail', 'gousse d ail': 'ail',
  'pomme de terre': 'pdt', patate: 'pdt', 'patate douce': null,
  tomate: 'tomates', 'tomate cerise': 'tomates', 'coulis de tomate': 'coulis', 'sauce tomate': 'coulis', 'tomate concassee': 'coulis', 'pulpe de tomate': 'coulis', 'passata': 'coulis', 'concentre de tomate': null,
  courgette: 'courgette', poivron: 'poivron', carotte: 'carotte', champignon: 'champignons', 'champignon de paris': 'champignons',
  salade: 'salade', laitue: 'salade', avocat: 'avocat', citron: 'citron', 'jus de citron': 'citron', 'citron vert': null,
  brocoli: 'brocoli', concombre: 'concombre',
  creme: 'creme', 'creme fraiche': 'creme', 'creme liquide': 'creme', 'creme epaisse': 'creme',
  'fromage rape': 'fromage', gruyere: 'fromage', emmental: 'fromage', parmesan: 'fromage', comte: 'fromage',
  feta: 'feta', mozzarella: 'mozza', jambon: 'jambon', 'jambon blanc': 'jambon', 'jambon cru': null,
  lardon: 'lardons', 'pate brisee': 'brisee', 'pate feuilletee': null, 'pate a pizza': null,
  poulet: 'poulet', 'blanc de poulet': 'poulet', 'filet de poulet': 'poulet', 'escalope de poulet': 'poulet',
  'viande hachee': 'hache', 'boeuf hache': 'hache', 'steak hache': 'hache',
  saumon: 'saumon', 'pave de saumon': 'saumon', cabillaud: 'cabillaud', 'filet de cabillaud': 'cabillaud', thon: 'thon',
  pate: 'pates', spaghetti: 'pates', spaghettis: 'pates', tortillas: 'tortillas', ananas: null, tagliatelle: 'pates', penne: 'pates', coquillette: 'pates', fusilli: 'pates', macaroni: 'pates',
  riz: 'riz', semoule: 'semoule', 'lentille corail': 'lentilles', lentille: null, 'pois chiche': 'poischiches', 'haricot rouge': 'haricots',
  'lait de coco': 'coco', tortilla: 'tortillas', wrap: 'tortillas', 'pain de mie': 'painmie', baguette: 'pain', pain: 'pain',
  'pain burger': 'painsburger', 'pain a burger': 'painsburger', 'petit pois': 'petitspois',
};
const SYN_KEYS = Object.keys(SYN).sort((a, b) => b.length - a.length);

/** Id du catalogue correspondant au nom, ou null. */
export function matchIngredient(name: string): string | null {
  const n = ' ' + normSing(name) + ' ';
  for (const k of SYN_KEYS) if (n.includes(' ' + k + ' ')) return SYN[k];
  return null;
}

const STAPLES = ['sel', 'poivre', 'huile', 'vinaigre', 'eau', 'sucre', 'bouillon', 'cube', 'epice', 'curry', 'cumin', 'paprika', 'cannelle', 'muscade', 'herbe de provence', 'thym', 'laurier', 'origan', 'moutarde', 'sauce soja', 'levure', 'piment', 'curcuma', 'gingembre moulu', 'quatre epice', 'fleur de sel'];
const KW: [CatKey, number, string[], ('m' | undefined)?][] = [
  ['surg', 180, ['surgele']],
  ['viande', 2, ['poulet', 'boeuf', 'porc', 'veau', 'agneau', 'dinde', 'canard', 'saucisse', 'chorizo', 'merguez', 'steak', 'escalope', 'poisson', 'crevette', 'moule', 'saumon', 'colin', 'lieu', 'truite', 'cabillaud', 'lapin', 'roti', 'cotelette', 'magret', 'lardon', 'bacon'], 'm'],
  ['frais', 10, ['beurre', 'lait', 'yaourt', 'creme', 'fromage', 'oeuf', 'mozzarella', 'ricotta', 'mascarpone', 'chevre', 'comte', 'reblochon', 'raclette', 'tofu', 'parmesan', 'jambon', 'pate feuilletee', 'pate a pizza', 'pate brisee', 'pate sablee']],
  ['boul', 3, ['pain', 'brioche', 'baguette', 'pita', 'focaccia']],
  ['fl', 6, ['salade', 'tomate', 'oignon', 'echalote', 'ail', 'poireau', 'chou', 'epinard', 'haricot vert', 'aubergine', 'fenouil', 'celeri', 'radis', 'betterave', 'patate douce', 'potiron', 'courge', 'butternut', 'pomme', 'poire', 'banane', 'orange', 'citron', 'fraise', 'framboise', 'mangue', 'ananas', 'kiwi', 'raisin', 'persil', 'coriandre', 'basilic', 'ciboulette', 'menthe', 'gingembre', 'champignon', 'navet', 'asperge', 'avocat', 'concombre', 'courgette', 'poivron', 'carotte', 'brocoli', 'chou fleur', 'petit pois frais', 'mache', 'roquette', 'citron vert', 'lime', 'cerise', 'peche', 'abricot', 'melon', 'pasteque']],
];
const hasWord = (n: string, k: string) => (' ' + n + ' ').includes(' ' + k + ' ');
const MEAT_WORDS = KW[1][2];

/** Devine rayon, conservation et drapeau pour un ingrédient inconnu. */
export function guessIngredient(name: string, unit: string): Ingredient {
  const n = normSing(name);
  const label = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  const u = unit || 'pc';
  if (STAPLES.some((k) => hasWord(n, k))) return [label, 'epi', 365, u, 's'];
  for (const [cat, days, words, flag] of KW) {
    if (words.some((k) => hasWord(n, k))) {
      const d = cat === 'frais' && hasWord(n, 'beurre') ? 30 : days;
      return [label, cat, d, u, flag ?? (cat !== 'viande' && MEAT_WORDS.some((k) => hasWord(n, k)) ? 'm' : undefined)].filter((x) => x !== undefined) as Ingredient;
    }
  }
  return [label, 'epi', 365, u];
}
export const CAT_DAYS: Record<CatKey, number> = { fl: 6, viande: 2, frais: 10, boul: 3, epi: 365, surg: 180 };
export const CAT_LABEL: Record<CatKey, string> = Object.fromEntries(CATS) as Record<CatKey, string>;

// ---------- Lecture d'une ligne d'ingrédient ----------
const WORDNUM: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, dix: 10, douze: 12, demi: 0.5 };
const FRAC: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
// [motif sur texte normalisé caractère par caractère, unité canonique, facteur]
const UNIT_RX: [RegExp, string, number][] = [
  [/^(kilogrammes?|kilos?|kg)\b/, 'g', 1000],
  [/^(grammes?|gr|g)\b/, 'g', 1],
  [/^(millilitres?|ml)\b/, 'cl', 0.1],
  [/^(centilitres?|cl)\b/, 'cl', 1],
  [/^(decilitres?|dl)\b/, 'cl', 10],
  [/^(litres?|l)\b/, 'cl', 100],
  [/^(cuilleres?|cuill?\.?|c\.?)\s*(a|à)\s*(soupe|s\.?)\b\.?/, 'c. à s.', 1],
  [/^(cas|cs|c\.s\.?)\b/, 'c. à s.', 1],
  [/^(cuilleres?|cuill?\.?|c\.?)\s*(a|à)\s*(cafe|c\.?|the)\b\.?/, 'c. à c.', 1],
  [/^(cac|cc|c\.c\.?)\b/, 'c. à c.', 1],
  [/^pincees?\b/, 'pincée', 1],
  [/^gousses?\b/, 'gousse', 1],
  [/^tranches?\b/, 'tranche', 1],
  [/^(boites?|conserves?)\b/, 'boîte', 1],
  [/^sachets?\b/, 'sachet', 1],
  [/^pots?\b/, 'pot', 1],
  [/^bottes?\b/, 'botte', 1],
  [/^brins?\b/, 'brin', 1],
];
// minuscule + accents retirés, en gardant la même longueur que l'original (pour découper l'original)
const flat = (s: string) => deaccent(s.toLowerCase());

export function parseIngredientLine(line: string): DraftIng | null {
  let raw = line.replace(/^\s*([-•*–·▪◦]|\d+[.)]\s)\s*/, '').trim();
  if (!raw) return null;
  let f = flat(raw);
  let qty: number | null = null;
  let m = f.match(/^(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?\s*([½¼¾⅓⅔])?/);
  if (m && m[0].trim()) {
    qty = parseFloat(m[1].replace(',', '.'));
    if (m[2]) qty = qty / parseFloat(m[2]);
    if (m[3]) qty += FRAC[m[3]];
  } else if ((m = f.match(/^([½¼¾⅓⅔])/))) {
    qty = FRAC[m[1]];
  } else if ((m = f.match(/^(une?|deux|trois|quatre|cinq|six|sept|huit|dix|douze|demi)\b/))) {
    qty = WORDNUM[m[1]];
  }
  if (m && qty !== null) {
    raw = raw.slice(m[0].length).trimStart();
    f = flat(raw);
  }
  let unit = '';
  if (qty !== null) {
    for (const [rx, u, fac] of UNIT_RX) {
      const um = f.match(rx);
      if (um) {
        unit = u;
        qty = qty * fac;
        raw = raw.slice(um[0].length).trimStart();
        break;
      }
    }
  }
  raw = raw.replace(/^(de la |de l['’]|du |des |de |d['’])/i, '');
  const name = raw.split(/\s*[,(;]\s*|\s+-\s+/)[0].replace(/[.:]+$/, '').trim();
  if (!name) return null;
  return { name: name.charAt(0).toUpperCase() + name.slice(1), qty, unit };
}

// ---------- Brouillon -> recette ----------
const PIECE_WEIGHT: Record<string, number> = { pdt: 150, champignons: 20 };

export function draftToRecipe(d: Draft, id: string, myIng: Record<string, Ingredient>): { recipe: Recipe; newIng: Record<string, Ingredient> } {
  const factor = 2 / Math.max(1, d.servings || 2);
  const newIng: Record<string, Ingredient> = {};
  const lines: [string, number][] = [];
  for (const di of d.ings) {
    if (!di.name.trim()) continue;
    let q = di.qty ?? 1;
    let ingId: string | null = matchIngredient(di.name);
    if (ingId) {
      const ku = ING[ingId][3];
      const du = di.unit;
      if (du === ku || (!du && ['pc', 'boîte', 'tranche', 'gousse'].includes(ku))) {
        // compatible tel quel
      } else if (!du && ku === 'g' && PIECE_WEIGHT[ingId]) {
        q = q * PIECE_WEIGHT[ingId];
      } else if (du === 'pc' && ['boîte', 'tranche', 'gousse'].includes(ku)) {
        // ok
      } else {
        ingId = null; // unités incompatibles : on le garde comme ingrédient à part
      }
    }
    if (!ingId) {
      ingId = 'u:' + slug(di.name) + (di.unit ? '-' + slug(di.unit) : '');
      const existing = myIng[ingId] ?? newIng[ingId];
      if (existing) {
        if (di.cat && existing[1] !== di.cat) newIng[ingId] = [existing[0], di.cat, CAT_DAYS[di.cat], existing[3], existing[4]].filter((x) => x !== undefined) as Ingredient;
      } else {
        const g = guessIngredient(di.name, di.unit);
        if (di.cat && di.cat !== g[1]) {
          g[1] = di.cat;
          g[2] = CAT_DAYS[di.cat];
        }
        newIng[ingId] = g;
      }
    }
    const prev = lines.find(([x]) => x === ingId);
    if (prev) prev[1] += q * factor;
    else lines.push([ingId, Math.round(q * factor * 100) / 100]);
  }
  const steps = d.steps.map((s) => s.trim()).filter(Boolean);
  return {
    recipe: { id, n: d.n.trim() || 'Ma recette', e: d.e || '🍽️', t: Math.max(1, Math.round(d.t || 30)), i: lines, s: steps.length ? steps : ['Prépare et sers.'], custom: true, ...(d.src ? { src: d.src } : {}) },
    newIng,
  };
}

/** Recette existante -> brouillon (pour la modifier). Quantités pour 2 personnes. */
export function recipeToDraft(r: Recipe): Draft {
  return {
    n: r.n,
    e: r.e,
    t: r.t,
    servings: 2,
    ings: r.i.map(([id, q]) => {
      const g = ingOf(id);
      return { name: g[0], qty: g[4] === 's' && q === 1 ? null : q, unit: g[3] === 'pc' ? '' : g[3], cat: g[1] };
    }),
    steps: [...r.s],
    src: r.src,
  };
}

export function guessEmoji(name: string): string {
  const n = normSing(name);
  const table: [string[], string][] = [
    [['pate', 'spaghetti', 'lasagne', 'tagliatelle', 'penne', 'carbonara', 'bolognaise'], '🍝'],
    [['curry', 'tajine', 'chili', 'dahl', 'mijote'], '🍛'],
    [['soupe', 'veloute', 'potage'], '🥣'],
    [['salade'], '🥗'],
    [['tarte', 'quiche'], '🥧'],
    [['gateau', 'cake', 'cookie', 'muffin', 'crepe', 'brownie'], '🍰'],
    [['pizza'], '🍕'],
    [['burger'], '🍔'],
    [['wrap', 'taco', 'burrito', 'fajita'], '🌯'],
    [['riz', 'risotto', 'paella'], '🍚'],
    [['omelette', 'oeuf'], '🍳'],
    [['poisson', 'saumon', 'cabillaud', 'thon', 'crevette'], '🐟'],
    [['poulet', 'dinde'], '🍗'],
    [['boeuf', 'steak', 'porc', 'veau', 'agneau'], '🥩'],
    [['gratin', 'fromage', 'raclette', 'tartiflette'], '🧀'],
    [['pomme de terre', 'puree', 'frite'], '🥔'],
  ];
  for (const [ws, e] of table) if (ws.some((w) => hasWord(n, w))) return e;
  return '🍽️';
}

// ---------- Lien : JSON-LD schema.org/Recipe ----------
const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, '’')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ')
    .trim();

export function isoMinutes(s?: string): number {
  if (!s) return 0;
  const m = String(s).match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (+(m[1] || 0)) * 1440 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return null;
  }
  const o = node as Record<string, unknown>;
  const t = o['@type'];
  if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return o;
  for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    const r = findRecipe(o[k]);
    if (r) return r;
  }
  return null;
}

function stepsOf(x: unknown): string[] {
  if (!x) return [];
  if (typeof x === 'string')
    return x
      .split(/\n+|<br\s*\/?>|<\/p>|<\/li>/i)
      .map(decode)
      .flatMap((p) => p.replace(/\.\s+(?=[A-ZÀ-Ý])/g, '.\u0001').split('\u0001'))
      .map((p) => p.trim())
      .filter((p) => p.length > 2);
  if (Array.isArray(x)) return x.flatMap(stepsOf);
  const o = x as Record<string, unknown>;
  if (o.itemListElement) return stepsOf(o.itemListElement);
  if (typeof o.text === 'string') return [decode(o.text)];
  if (typeof o.name === 'string') return [decode(o.name)];
  return [];
}

export function servingsOf(y: unknown): number {
  const s = Array.isArray(y) ? y.join(' ') : String(y ?? '');
  const m = s.match(/\d+/);
  return m ? Math.max(1, Math.min(50, +m[0])) : 4;
}

/** Cherche une recette schema.org dans le HTML d'une page. */
export function parseRecipeHtml(html: string, url?: string): Draft | null {
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      try {
        data = JSON.parse(m[1].trim().replace(/[\u0000-\u001f]+/g, ' '));
      } catch {
        continue;
      }
    }
    const r = findRecipe(data);
    if (!r) continue;
    const n = decode(String(r.name ?? 'Recette importée'));
    const ings = ((r.recipeIngredient ?? r.ingredients ?? []) as unknown[])
      .map((l) => parseIngredientLine(decode(String(l))))
      .filter((x): x is DraftIng => !!x);
    const t = isoMinutes(r.totalTime as string) || isoMinutes(r.prepTime as string) + isoMinutes(r.cookTime as string) || 30;
    return { n, e: guessEmoji(n), t, servings: servingsOf(r.recipeYield), ings, steps: stepsOf(r.recipeInstructions), src: url };
  }
  return null;
}

export async function importFromUrl(url: string, fetcher: typeof fetch = fetch): Promise<Draft> {
  const res = await fetcher(url, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', Accept: 'text/html' } });
  if (!res.ok) throw new Error(`La page a répondu ${res.status}.`);
  const d = parseRecipeHtml(await res.text(), url);
  if (!d) throw new Error('Pas de recette lisible sur cette page. Copie le texte de la recette et colle-le à la place.');
  return d;
}

// ---------- Texte libre ----------
const H_ING = /^\s*(liste des\s+)?ingr[eé]dients?\b[^a-z]*$/i;
const H_STEP = /^\s*(pr[eé]paration|[eé]tapes?|instructions?|d[eé]roul[eé]|recette|m[eé]thode)\b[^a-z]*$/i;
const looksLikeIng = (l: string) => /^\s*([-•*–·]|\d|[½¼¾]|(une?|deux|trois|quatre|cinq|six)\s)/i.test(l) && l.length < 80;

export function parseRecipeText(text: string): Draft {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  let n = '';
  let servings = 0;
  let t = 0;
  const ingL: string[] = [];
  const stepL: string[] = [];
  let mode: 'head' | 'ing' | 'step' = 'head';
  const hasHeaders = lines.some((l) => H_ING.test(l));
  for (const l of lines) {
    if (!l) continue;
    if (H_ING.test(l)) {
      mode = 'ing';
      continue;
    }
    if (H_STEP.test(l)) {
      mode = 'step';
      continue;
    }
    const sm = l.match(/(\d+)\s*(personnes?|pers\b|parts?|portions?|couverts?)/i);
    if (sm && l.length < 50) {
      servings = +sm[1];
      if (mode === 'head' && !n) continue;
      if (mode !== 'step') continue;
    }
    const tm = l.match(/^(temps|dur[eé]e|cuisson|pr[eé]paration)?[^0-9]{0,20}(\d+)\s*(h|min)/i);
    if (tm && l.length < 40 && mode !== 'step') {
      t += tm[3].toLowerCase() === 'h' ? +tm[2] * 60 : +tm[2];
      continue;
    }
    if (mode === 'head') {
      if (!n) {
        n = l.replace(/^#+\s*/, '');
        continue;
      }
      if (!hasHeaders && looksLikeIng(l)) {
        ingL.push(l);
        continue;
      }
      if (!hasHeaders) mode = ingL.length ? 'step' : 'head';
      if (mode === 'head') continue;
    }
    if (mode === 'ing') ingL.push(l);
    else stepL.push(l);
  }
  const steps = stepL.map((s) => s.replace(/^\s*(([eé]tape\s*)?\d+\s*[.):-]|[-•*])\s*/i, '').trim()).filter(Boolean);
  n = n || 'Recette importée';
  return {
    n,
    e: guessEmoji(n),
    t: t || 30,
    servings: servings || 2,
    ings: ingL.map(parseIngredientLine).filter((x): x is DraftIng => !!x),
    steps,
  };
}

// ---------- Partage entre téléphones ----------
type SharedIng = [string, number, Ingredient?];
type SharedRecipe = { n: string; e: string; t: number; i: SharedIng[]; s: string[]; src?: string };

export function recipeToText(r: Recipe): string {
  const body =
    `${r.e} ${r.n} (${r.t} min, pour 2)\n\nIngrédients :\n` +
    r.i.map(([id, q]) => {
      const g = ingOf(id);
      return g[4] === 's' ? `- ${g[0]}` : `- ${g[0]} : ${fmtShare(g, q)}`;
    }).join('\n') +
    `\n\nPréparation :\n` +
    r.s.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return body;
}
const fmtShare = (g: Ingredient, q: number) => {
  const v = Math.round(q * 100) / 100;
  return g[3] === 'pc' ? String(v).replace('.', ',') : `${String(v).replace('.', ',')} ${g[3]}`;
};

/** Texte à partager : lisible par un humain + une ligne technique pour l'import exact. */
export function shareText(recipes: Recipe[]): string {
  const payload: { v: 1; r: SharedRecipe[] } = {
    v: 1,
    r: recipes.map((r) => ({
      n: r.n,
      e: r.e,
      t: r.t,
      s: r.s,
      ...(r.src ? { src: r.src } : {}),
      i: r.i.map(([id, q]): SharedIng => (ING[id] ? [id, q] : [id, q, ingOf(id)])),
    })),
  };
  const human = recipes.length === 1 ? recipeToText(recipes[0]) : recipes.map((r) => `${r.e} ${r.n}`).join('\n');
  return `${human}\n\nPour l'ajouter dans Au Menu de Luciole : copie tout ce message, puis Recettes › Importer.\n${SHARE_TAG}${JSON.stringify(payload)}`;
}

/** Lit un message partagé. Renvoie null si le texte n'en contient pas. */
export function parseShared(text: string): { recipes: Omit<Recipe, 'id'>[]; ing: Record<string, Ingredient> } | null {
  const i = text.lastIndexOf(SHARE_TAG.trim());
  if (i < 0) return null;
  const json = text.slice(i + SHARE_TAG.trim().length).trim();
  let data: { v: number; r: SharedRecipe[] };
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!data || !Array.isArray(data.r)) return null;
  const ing: Record<string, Ingredient> = {};
  const recipes = data.r.map((r) => ({
    n: String(r.n),
    e: String(r.e || '🍽️'),
    t: Number(r.t) || 30,
    s: (r.s || []).map(String),
    custom: true as const,
    ...(r.src ? { src: String(r.src) } : {}),
    i: (r.i || []).map(([id, q, g]): [string, number] => {
      if (!ING[id] && g) ing[id] = g;
      return [id, Number(q) || 1];
    }),
  }));
  return { recipes, ing };
}

export const looksLikeUrl = (s: string) => /^\s*https?:\/\/\S+\s*$/i.test(s);
export const newRecipeId = () => 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
