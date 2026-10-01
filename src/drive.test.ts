import { test } from 'node:test';
import assert from 'node:assert/strict';
import { driveCanSearch, driveUrl, leclercBase, searchTerm } from './drive';

const base = { store: null, leclercUrl: '', customUrl: '' } as const;

test('driveUrl par enseigne', () => {
  assert.equal(driveUrl({ ...base }, 'Lait'), null);
  assert.equal(driveUrl({ ...base, store: 'carrefour' }, 'Crème fraîche'), 'https://www.carrefour.fr/s?q=Cr%C3%A8me%20fra%C3%AEche');
  assert.equal(driveUrl({ ...base, store: 'auchan' }, 'Riz'), 'https://www.auchan.fr/recherche?text=Riz');
  assert.equal(driveUrl({ ...base, store: 'intermarche' }, 'Petits pois surgelés'), 'https://www.intermarche.com/recherche/Petits%20pois');
  assert.equal(driveUrl({ ...base, store: 'leclerc' }, 'Riz'), 'https://www.leclercdrive.fr/');
  assert.equal(
    driveUrl({ ...base, store: 'leclerc', leclercUrl: 'https://fd7-courses.leclercdrive.fr/magasin-036001-Saint-Just-en-Chaussee/accueil.aspx' }, 'Persil'),
    'https://fd7-courses.leclercdrive.fr/magasin-036001-Saint-Just-en-Chaussee/recherche.aspx?TexteRecherche=Persil',
  );
  assert.equal(driveUrl({ ...base, store: 'autre', customUrl: 'https://monmagasin.fr/search?q={q}' }, 'Œufs'), 'https://monmagasin.fr/search?q=%C5%92ufs');
});

test('aides', () => {
  assert.equal(leclercBase('n’importe quoi'), null);
  assert.equal(searchTerm('Lait de coco (bio)'), 'Lait de coco');
  assert.equal(driveCanSearch({ ...base, store: 'leclerc' }), false);
  assert.equal(driveCanSearch({ ...base, store: 'carrefour' }), true);
});
