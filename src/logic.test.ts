import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RBY, RECIPES } from './data';
import { DEFAULT_STATE, buildLists, fillEmpty, filterRecipes, fits, fmt, lastTrip, listText, tags, warnKeys, type AppState } from './logic';

const st = (p: Partial<AppState> = {}): AppState => ({ ...DEFAULT_STATE, ...p });

test('lastTrip : course la plus récente, avec bouclage sur la semaine', () => {
  const S = st({ shop: [3, 0] });
  assert.deepEqual(lastTrip(S, 0), { s: 0, gap: 0 });
  assert.deepEqual(lastTrip(S, 2), { s: 0, gap: 2 });
  assert.deepEqual(lastTrip(S, 6), { s: 3, gap: 3 });
  assert.deepEqual(lastTrip(st({ shop: [5] }), 1), { s: 5, gap: 3 });
  assert.equal(lastTrip(st({ shop: [] }), 1), null);
});

test('fits : produit très frais trop loin de la course', () => {
  const S = st({ shop: [0] });
  assert.equal(fits(S, RBY.saumon, 1), true); // saumon 2 j, 1 j après
  assert.equal(fits(S, RBY.saumon, 4), false);
  assert.equal(fits(S, RBY.grecque, 6), false); // tomates 5 j
  assert.equal(fits(S, RBY.shakshuka, 2), true); // baguette = jour même, ignorée
});

test('fmt : unités et arrondis', () => {
  assert.equal(fmt('pates', 200), '200 g');
  assert.equal(fmt('pdt', 1200), '1,2 kg');
  assert.equal(fmt('pates', 3), '10 g');
  assert.equal(fmt('creme', 20), '20 cl');
  assert.equal(fmt('oeufs', 2.5), '3');
  assert.equal(fmt('thon', 1), '1 boîte');
  assert.equal(fmt('jambon', 4), '4 tranches');
});

test('tags', () => {
  assert.deepEqual(tags(RBY.caprese), ['rapide', 'vege']);
  assert.deepEqual(tags(RBY.saumon), ['poisson']);
  assert.ok(tags(RBY.pthon).includes('poisson'));
  assert.ok(!tags(RBY.carbo).includes('vege'));
});

test('buildLists : placard sur la 1re course, frais sur la course la plus proche', () => {
  const S = st({ shop: [0, 3], plan: { '1-soir': 'carbo', '4-soir': 'carbo' } });
  const { trips, warns } = buildLists(S);
  assert.equal(trips.length, 2);
  assert.deepEqual(trips[0].cover, [0, 1, 2]);
  assert.deepEqual(trips[1].cover, [3, 4, 5, 6]);
  assert.equal(trips[0].items.pates.q, 400); // longue conservation cumulée
  assert.equal(trips[1].items.pates, undefined);
  assert.equal(trips[0].items.lardons.q, 150);
  assert.equal(trips[1].items.lardons.q, 150);
  assert.equal(warns.length, 0);
});

test('buildLists : quantités selon le nombre de personnes et alertes', () => {
  const S = st({ persons: 4, shop: [0], plan: { '5-soir': 'saumon' } });
  const { trips, warns } = buildLists(S);
  assert.equal(trips[0].items.saumon.q, 4);
  assert.ok(warns.some((w) => w.id === 'saumon' && w.gap === 5));
  assert.ok(warnKeys(S).has('5-soir'));
});

test('buildLists : repas désactivé ignoré, restes ignorés', () => {
  const S = st({ plan: { '1-midi': 'carbo', '2-soir': 'restes' } });
  const { trips } = buildLists(S);
  assert.equal(trips.every((t) => !Object.keys(t.items).length), true);
});

test('fillEmpty : remplit 7 soirs sans doublon et garde l’existant', () => {
  let i = 0;
  const rand = () => (i++ * 0.37) % 1;
  const S = st({ plan: { '0-soir': 'dahl' } });
  const { plan, added } = fillEmpty(S, rand);
  assert.equal(added, 6);
  assert.equal(plan['0-soir'], 'dahl');
  assert.equal(new Set(Object.values(plan)).size, 7);
  for (const [k, id] of Object.entries(plan)) assert.ok(fits(S, RBY[id], +k.split('-')[0]), k + ' ' + id);
});

test('filterRecipes : filtre, recherche et tri frigo', () => {
  assert.equal(filterRecipes(st(), 'tout', '').length, RECIPES.length);
  assert.ok(filterRecipes(st(), 'vege', '').every((r) => tags(r).includes('vege')));
  assert.deepEqual(filterRecipes(st(), 'tout', 'RISOTTO').map((r) => r.id), ['risotto']);
  const top = filterRecipes(st({ fridge: ['tortillas', 'avocat', 'poulet'] }), 'tout', '')[0];
  assert.equal(top.id, 'wraps');
});

test('listText', () => {
  const S = st({ shop: [0], plan: { '0-soir': 'pthon' }, extras: [{ t: 'Café', c: false }, { t: 'Lessive', c: true }] });
  const t = listText(S);
  assert.match(t, /^🛒 Lundi/);
  assert.match(t, /- Pâtes : 200 g/);
  assert.match(t, /- Café/);
  assert.doesNotMatch(t, /Lessive/);
});
