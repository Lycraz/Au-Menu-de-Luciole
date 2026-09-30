# Au Menu de Luciole

Application iPhone, iPad et Android. Elle planifie les repas de la semaine et prépare la liste de courses rayon par rayon.

- **Semaine** : jours de courses, nombre de personnes, repas du midi et du soir, remplissage au hasard, alertes de fraîcheur.
- **Courses** : une liste par jour de courses, avec les quantités ajustées, tes propres articles, et la liste à copier.
- **Recettes** : 23 plats simples, avec des filtres (rapide, végé, poisson) et un tri selon ce que tu as déjà.

L'app est faite avec [Expo](https://expo.dev) (React Native + TypeScript). Les données restent sur le téléphone.

- `App.tsx`, `src/` : code de l'app (commun à iPhone et Android)
- `.github/workflows/build.yml` : fabrication automatique des deux apps à chaque modification
- `sidestore/source.json` : source SideStore, mise à jour automatiquement

## Comment fonctionnent les mises à jour

1. Une modification du code arrive sur GitHub (branche `main`).
2. GitHub Actions lance les tests, puis compile l'app iPhone (`AuMenuDeLuciole.ipa`) sur un Mac et l'app Android (`AuMenuDeLuciole.apk`).
3. Une nouvelle **version** est publiée (onglet *Releases*) avec les deux fichiers.
4. La source SideStore est mise à jour : l'iPhone propose la mise à jour dans SideStore. Côté Android, Obtainium la propose aussi.

Chaque version est numérotée automatiquement : 1.0.1, 1.0.2, etc.

## Mise en place (une seule fois)

### 1. Secrets pour l'app Android

L'APK doit toujours être signé avec la même clé. On peut réutiliser celle de Scan Tickets.
Dans le dépôt GitHub, va dans **Settings › Secrets and variables › Actions › New repository secret** et crée ces deux secrets :

| Nom | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | le contenu du fichier `keystore_base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | le contenu du fichier `password.txt` |

Si tu utilises une autre clé, ajoute aussi un secret `ANDROID_KEY_ALIAS` avec son alias. Par défaut, l'alias utilisé est `scantickets`.
**Ne mets jamais ces fichiers dans le dépôt.**

### 2. Lancer la première fabrication

Onglet **Actions › Construire et publier › Run workflow**. Compte 15 à 25 minutes.

### 3. iPhone : ajouter la source dans SideStore

1. Dans SideStore, ouvre l'onglet **Sources** et touche **+**.
2. Colle l'adresse suivante :
   `https://raw.githubusercontent.com/Lycraz/au-menu-de-luciole/main/sidestore/source.json`
3. Au Menu de Luciole apparaît dans la source. Les mises à jour arrivent ensuite dans **My Apps**.

### 4. Android : Obtainium

Dans Obtainium, touche **Ajouter une app** et colle `https://github.com/Lycraz/au-menu-de-luciole`.

## Développer

```bash
npm install
npm run setup     # installe les versions compatibles avec Expo
npm test          # tests de la logique (planning, fraîcheur, listes)
npm run typecheck
```

## Structure

```
App.tsx                  coque : onglets, défilement, message temporaire
src/data.ts              ingrédients et recettes
src/logic.ts             logique pure (listes de courses, fraîcheur, tirage au hasard)
src/logic.test.ts        tests
src/store.tsx            état et sauvegarde
src/theme.ts             couleurs clair / sombre
src/components/          UI réutilisable, fiches recette, sélecteur de plat
src/screens/             écrans Semaine, Courses, Recettes
plugins/                 signature Android (plugin Expo)
scripts/                 version et source SideStore (utilisés par GitHub Actions)
```
