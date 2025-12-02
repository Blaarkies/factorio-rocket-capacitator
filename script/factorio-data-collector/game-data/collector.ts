import { join } from 'node:path';
import { getScriptPaths } from '../common/path.ts';
import { getAsset } from '../common/disk.ts';
import {
  parseDataUpdatesFromContent,
  parseItemsFromContent,
  parseRecipesFromContent
} from '../parse/index.ts';
import type { FactorioItem, FactorioRecipe } from './type.ts';

let {pathToHere} = getScriptPaths();

// TODO: use github urls when stable
let gitFd = join(pathToHere, 'mock-assets/');

let itemB = gitFd + 'base/prototypes/item.lua';
let recipeB = gitFd + 'base/prototypes/recipe.lua';

let itemQ = gitFd + 'quality/prototypes/item.lua';
let recipeQ = gitFd + 'quality/prototypes/recipe.lua';

let itemEr = gitFd + 'elevated-rails/prototypes/item/elevated-rails.lua';
let recipeEr = gitFd + 'elevated-rails/prototypes/recipe/elevated-rails.lua';

let itemSa = gitFd + 'space-age/prototypes/item.lua';
let recipeSa = gitFd + 'space-age/prototypes/recipe.lua';
let dataUpdatesSA = gitFd + 'space-age/base-data-updates.lua';

export async function getItems() {
  let allItems = await Promise.all([itemB, itemSa, itemQ, itemEr]
    .map(async p => {
      let content = await getAsset(p);
      return parseItemsFromContent(content);
    }))
  let items = allItems.flatMap(items => items.filter(i => !i.hidden));

  return items;
}

export async function getRecipes() {
  let allRecipes = await Promise.all([recipeB, recipeSa, recipeQ, recipeEr]
    .flatMap(async p => {
      let content = await getAsset(p);
      return parseRecipesFromContent(content);
    }));
  let recipes = allRecipes.flat();

  return recipes;
}

export async function getDataUpdates() {
  let content = await getAsset(dataUpdatesSA);
  return parseDataUpdatesFromContent(content);
}

export function applyDataUpdates(
  items: FactorioItem[],
  recipes: FactorioRecipe[],
  dataUpdates: any) {
  let recipeNameMap = new Map<string, FactorioRecipe>(
    recipes.map(i => [i.name, i]));

  for (let update of dataUpdates) {
    let {recipeName, propertyName, value, indexed, inserted} = update;

    let oldRecipe = recipeNameMap.get(recipeName);
    if (indexed >= 0) {
      oldRecipe[propertyName][indexed] = value;
      continue;
    }
    if (inserted) {
      oldRecipe[propertyName].push(value);
      continue;
    }

    oldRecipe[propertyName] = value;
  }


}
