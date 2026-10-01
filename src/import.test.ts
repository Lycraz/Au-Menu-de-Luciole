import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setUserData } from './catalog';
import { DEFAULT_STATE, buildLists, fits, type AppState } from './logic';
import { draftToRecipe, isoMinutes, matchIngredient, parseIngredientLine, parseRecipeHtml, parseRecipeText, parseShared, recipeToDraft, shareText } from './import';

test('parseIngredientLine', () => {
  assert.deepEqual(parseIngredientLine('200 g de farine'), { name: 'Farine', qty: 200, unit: 'g' });
  assert.deepEqual(parseIngredientLine('1,5 kg de pommes de terre'), { name: 'Pommes de terre', qty: 1500, unit: 'g' });
  assert.deepEqual(parseIngredientLine('- 3 œufs'), { name: 'Œufs', qty: 3, unit: '' });
  assert.deepEqual(parseIngredientLine('2 cuillères à soupe d’huile d’olive'), { name: 'Huile d’olive', qty: 2, unit: 'c. à s.' });
  assert.deepEqual(parseIngredientLine('1 c. à c. de cumin'), { name: 'Cumin', qty: 1, unit: 'c. à c.' });
  assert.deepEqual(parseIngredientLine('20 cl de crème fraîche'), { name: 'Crème fraîche', qty: 20, unit: 'cl' });
  assert.deepEqual(parseIngredientLine('250 ml de lait'), { name: 'Lait', qty: 25, unit: 'cl' });
  assert.deepEqual(parseIngredientLine('½ citron'), { name: 'Citron', qty: 0.5, unit: '' });
  assert.deepEqual(parseIngredientLine('1/2 oignon'), { name: 'Oignon', qty: 0.5, unit: '' });
  assert.deepEqual(parseIngredientLine('2 gousses d’ail'), { name: 'Ail', qty: 2, unit: 'gousse' });
  assert.deepEqual(parseIngredientLine('un oignon, émincé'), { name: 'Oignon', qty: 1, unit: '' });
  assert.deepEqual(parseIngredientLine('Sel, poivre'), { name: 'Sel', qty: null, unit: '' });
  assert.deepEqual(parseIngredientLine('4 tranches de jambon'), { name: 'Jambon', qty: 4, unit: 'tranche' });
  assert.deepEqual(parseIngredientLine('1 lardon'), { name: 'Lardon', qty: 1, unit: '' });
  assert.equal(parseIngredientLine('  '), null);
});

test('matchIngredient', () => {
  assert.equal(matchIngredient('Œufs'), 'oeufs');
  assert.equal(matchIngredient('pommes de terre'), 'pdt');
  assert.equal(matchIngredient('Coulis de tomate'), 'coulis');
  assert.equal(matchIngredient('Tomates cerises'), 'tomates');
  assert.equal(matchIngredient('Pâte feuilletée'), null);
  assert.equal(matchIngredient('spaghettis'), 'pates');
  assert.equal(matchIngredient('Poivre'), null);
  assert.equal(matchIngredient('Gousse d’ail'), 'ail');
  assert.equal(matchIngredient('Paille'), null);
});

test('isoMinutes', () => {
  assert.equal(isoMinutes('PT1H30M'), 90);
  assert.equal(isoMinutes('PT45M'), 45);
  assert.equal(isoMinutes(undefined), 0);
});

const HTML = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":["Recipe"],"name":"Gratin dauphinois &amp; salade","recipeYield":"4 personnes","totalTime":"PT1H10M","recipeIngredient":["1 kg de pommes de terre","40 cl de crème liquide","2 gousses d'ail","Sel, poivre","1 pincée de muscade"],"recipeInstructions":[{"@type":"HowToStep","text":"Préchauffer le four à 180°C."},{"@type":"HowToSection","itemListElement":[{"@type":"HowToStep","text":"Éplucher les pommes de terre."},{"@type":"HowToStep","text":"Cuire 1 h."}]}]}]}</script></head></html>`;

test('parseRecipeHtml (JSON-LD)', () => {
  const d = parseRecipeHtml(HTML, 'https://exemple.fr/gratin')!;
  assert.equal(d.n, 'Gratin dauphinois & salade');
  assert.equal(d.servings, 4);
  assert.equal(d.t, 70);
  assert.equal(d.e, '🥗');
  assert.equal(d.ings.length, 5);
  assert.deepEqual(d.steps, ['Préchauffer le four à 180°C.', 'Éplucher les pommes de terre.', 'Cuire 1 h.']);
  assert.equal(parseRecipeHtml('<html>rien</html>'), null);
  const d2 = parseRecipeHtml(`<script type="application/ld+json">{"@type":"Recipe","name":"X","recipeInstructions":"Couper. Cuire 10 min.\\nServir."}</script>`)!;
  assert.deepEqual(d2.steps, ['Couper.', 'Cuire 10 min.', 'Servir.']);
});

test('draftToRecipe : correspondances, conversions, portions, placard', () => {
  const d = parseRecipeHtml(HTML)!;
  const { recipe, newIng } = draftToRecipe(d, 'u-1', {});
  const map = Object.fromEntries(recipe.i);
  assert.equal(map.pdt, 500); // 1 kg pour 4 -> 500 g pour 2
  assert.equal(map.creme, 20);
  assert.equal(map.ail, 1);
  assert.ok(newIng['u:sel'] && newIng['u:sel'][4] === 's');
  assert.ok(newIng['u:muscade-pincee'][4] === 's');
  assert.equal(recipe.custom, true);
  // pièces -> grammes pour les pommes de terre
  const r2 = draftToRecipe({ n: 'P', e: '', t: 10, servings: 2, ings: [{ name: 'Pommes de terre', qty: 3, unit: '' }], steps: [] }, 'u-2', {});
  assert.deepEqual(r2.recipe.i, [['pdt', 450]]);
  // rayon choisi à la main
  const r3 = draftToRecipe({ n: 'Q', e: '', t: 10, servings: 2, ings: [{ name: 'Quinoa', qty: 150, unit: 'g', cat: 'fl' }], steps: [] }, 'u-3', {});
  assert.equal(r3.newIng['u:quinoa-g'][1], 'fl');
  assert.equal(r3.newIng['u:quinoa-g'][2], 6);
});

test('recettes perso dans la liste de courses (placard exclu, fraîcheur)', () => {
  const d = parseRecipeText(`Saumon express\nPour 2 personnes\n\nIngrédients\n2 pavés de saumon\n1 pincée de sel\n150 g de quinoa\n\nPréparation\n1. Cuire le quinoa.\n2. Poêler le saumon.`);
  const { recipe, newIng } = draftToRecipe(d, 'u-9', {});
  setUserData([recipe], newIng);
  const S: AppState = { ...DEFAULT_STATE, shop: [0], plan: { '0-soir': 'u-9' }, myRecipes: [recipe], myIng: newIng };
  const { trips } = buildLists(S);
  const ids = Object.keys(trips[0].items).sort();
  assert.deepEqual(ids, ['saumon', 'u:quinoa-g']);
  assert.equal(fits(S, recipe, 4), false);
  setUserData([], {});
});

test('parseRecipeText sans titres de sections', () => {
  const d = parseRecipeText('Pâtes au pesto\n- 200 g de pâtes\n- 1 pot de pesto\nFaire cuire les pâtes.\nMélanger avec le pesto.');
  assert.equal(d.n, 'Pâtes au pesto');
  assert.equal(d.e, '🍝');
  assert.equal(d.ings.length, 2);
  assert.deepEqual(d.steps, ['Faire cuire les pâtes.', 'Mélanger avec le pesto.']);
});

test('partage : aller-retour exact', () => {
  const d = parseRecipeText('Bol quinoa\nIngrédients\n150 g de quinoa\n2 œufs\nÉtapes\nCuire.');
  const { recipe, newIng } = draftToRecipe(d, 'u-5', {});
  setUserData([recipe], newIng);
  const txt = shareText([recipe]);
  assert.match(txt, /Quinoa : 150 g/);
  const back = parseShared('blabla\n' + txt)!;
  assert.equal(back.recipes.length, 1);
  assert.deepEqual(back.recipes[0].i, recipe.i);
  assert.deepEqual(back.ing['u:quinoa-g'], newIng['u:quinoa-g']);
  assert.equal(parseShared('pas de code'), null);
  // modification : brouillon -> recette identique
  const again = draftToRecipe(recipeToDraft(recipe), 'u-5', newIng);
  assert.deepEqual(again.recipe.i, recipe.i);
  setUserData([], {});
});
