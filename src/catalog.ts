// Catalogue fusionné : recettes et ingrédients de base + ceux créés ou importés par l'utilisateur.
// Le store appelle setUserData() à chaque rendu ; la logique lit via ingOf / recipeOf / allRecipes.
import { ING, RBY, RECIPES, type Ingredient, type Recipe } from './data';

let userRecipes: Recipe[] = [];
let userIng: Record<string, Ingredient> = {};
let userById: Record<string, Recipe> = {};

export function setUserData(recipes: Recipe[] = [], ing: Record<string, Ingredient> = {}) {
  if (recipes === userRecipes && ing === userIng) return;
  userRecipes = recipes;
  userIng = ing;
  userById = Object.fromEntries(recipes.map((r) => [r.id, r]));
}

const UNKNOWN: Ingredient = ['?', 'epi', 365, 'pc'];
export const ingOf = (id: string): Ingredient => ING[id] ?? userIng[id] ?? [id.replace(/^u:/, '').replace(/-/g, ' '), ...UNKNOWN.slice(1)] as Ingredient;
export const recipeOf = (id: string): Recipe | undefined => RBY[id] ?? userById[id];
export const allRecipes = (): Recipe[] => [...userRecipes, ...RECIPES];
export const isStaple = (id: string) => ingOf(id)[4] === 's';
export const allIngredientIds = () => [...Object.keys(ING), ...Object.keys(userIng)];
