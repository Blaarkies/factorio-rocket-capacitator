import { join } from 'node:path';
import { getScriptPaths } from '../common/path.ts';
import { getAsset } from '../common/disk.ts';
import {
  parseDataUpdatesFromContent,
  parseItemsFromContent,
  parseRecipesFromContent
} from '../parse/index.ts';
import type { FactorioItem, FactorioRecipe } from './type.ts';
import {
  energyPerEmpty,
  fluidPerBarrel,
  parseFluidFromContent
} from '../parse/parse-fluid.ts';

let {pathToHere} = getScriptPaths();

// TODO: use github urls when stable
let gitFd = join(pathToHere, 'mock-assets/');

let itemB = gitFd + 'base/prototypes/item.lua';
let fluidB = gitFd + 'base/prototypes/fluid.lua';
let recipeB = gitFd + 'base/prototypes/recipe.lua';

let itemQ = gitFd + 'quality/prototypes/item.lua';
let recipeQ = gitFd + 'quality/prototypes/recipe.lua';

let itemEr = gitFd + 'elevated-rails/prototypes/item/elevated-rails.lua';
let recipeEr = gitFd + 'elevated-rails/prototypes/recipe/elevated-rails.lua';

let itemSa = gitFd + 'space-age/prototypes/item.lua';
let fluidSa = gitFd + 'space-age/prototypes/fluid.lua';
let recipeSa = gitFd + 'space-age/prototypes/recipe.lua';
let dataUpdatesSA = gitFd + 'space-age/base-data-updates.lua';

export async function getItems() {
  let allItems = await Promise.all([itemB, itemSa, itemQ, itemEr]
    .map(async p => {
      let content = await getAsset(p);
      return parseItemsFromContent(content);
    }))
  let items = allItems.flatMap(items =>
    items.filter(i => !i.hidden && i.subgroup !== 'spawnables')
  );

  return items;
}

/** Fluid barrels do not exist in the data. They are procedurally created by
 * following each fluid type and its properties */
export async function getBarrels(): Promise<{
  barrels: FactorioItem[],
  barrelRecipes: FactorioRecipe[];
}> {
  let allItems = await Promise.all([fluidB, fluidSa]
    .map(async p => {
      let content = await getAsset(p);
      return parseFluidFromContent(content);
    }))
  let barrels = allItems.flat();
  let barrelRecipes = barrels.map(b => ({
    type: 'recipe',
    name: `empty-${b.name}`,
    energy_required: energyPerEmpty,
    ingredients: [{type: 'item', name: b.name, amount: 1}],
    results: [{type: 'item', name: 'barrel', amount: 1}],
  }) as FactorioRecipe);

  return {barrels, barrelRecipes};
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

/** Factorio mods run updates on base data to apply new settings and changes,
 * notable: Adding the biter-egg ingredient to productivity-module-3 */
export function applyDataUpdates(
  items: FactorioItem[],
  recipes: FactorioRecipe[],
  dataUpdates: any) {
  let recipeNameMap = new Map<string, FactorioRecipe>(
    recipes.map(i => [i.name, i]));

  for (let update of dataUpdates) {
    let {recipeName, propertyName, value, indexed, inserted} = update;

    let oldRecipe = recipeNameMap.get(recipeName);

    // refers to index element overrides, such as the 3rd ingredient in
    // `data.raw.recipe["atomic-bomb"].ingredients[3] = ...`
    if (indexed >= 0) {
      oldRecipe[propertyName][indexed] = value;
      continue;
    }

    // refers to `table.insert(data.raw...)`
    if (inserted) {
      oldRecipe[propertyName].push(value);
      continue;
    }

    oldRecipe[propertyName] = value;
  }
}

/** Replace every fluid ingredient (that can be barreled) with the equivalent
 * fluid-barrel item with correct amount */
export function applyRecipeFluidToBarrelSubstitutions(
  recipes: FactorioRecipe[], barrels: FactorioItem[]) {
  let fluidBarrelMap = new Map<string, FactorioItem>(
    barrels.map(b => [b.name.replace('-barrel', ''), b]));

  for (let recipe of recipes) {
    for (let ingredient of recipe.ingredients) {
      if (!fluidBarrelMap.has(ingredient.name)) {
        continue;
      }

      let barrel = fluidBarrelMap.get(ingredient.name);
      ingredient.type = barrel.type;
      ingredient.name = barrel.name;
      ingredient.amount = ingredient.amount / fluidPerBarrel;
    }
  }
}

/** Replace every fluid ingredient with the ingredients used to make that
 * ingredient, until all recipe ingredients are non-fluid
 * @example
 * holmium-plate requires holmium-solution (cannot be barreled), which
 * requires holmium-ore
 * ∴ 1 plate = .4 ore + .2 stone + .02 water-barrel */
export function applyRecipeFluidToItemsSubstitutions(
  recipes: FactorioRecipe[], items: FactorioItem[]) {

  let affected = recipes
    .filter(r => r.ingredients.some(i => i.type === 'fluid'));
  let remaining = affected.slice();
  let i = 0;
  while (remaining.length) {
    if (i > remaining.length - 2) {
      i = 0;
    }

    let recipe = remaining[i++];

    let fluidIngredientsWithAlts = recipe.ingredients
      .filter(i => i.type === 'fluid')
      .map(fluidIngredient => ({
        fluidIngredient,
        alternativeRecipe: recipes
          .find(r => r.name === fluidIngredient.name),
      }))
      .filter(alt => alt.alternativeRecipe);

    for (let alt of fluidIngredientsWithAlts) {
      let {fluidIngredient, alternativeRecipe} = alt;

      let result = alternativeRecipe.results
        .find(r => r.name === fluidIngredient.name);
      let resultYield = result.amount * (result.probability ?? 1);
      let yieldRatio = fluidIngredient.amount / resultYield;

      let alternativeIngredients = alternativeRecipe
        .ingredients
        .map(ai => ({
          ...ai,
          amount: ai.amount * yieldRatio,
        } as FactorioRecipe['ingredients'][0]));

      for (let altIngredient of alternativeIngredients) {
        let duplicate = recipe.ingredients
          .find(i => i.name === altIngredient.name);
        if (duplicate) {
          duplicate.amount+=altIngredient.amount;
          continue;
        }

        recipe.ingredients.push(altIngredient);
      }

      recipe.ingredients = recipe.ingredients
        .filter(i => i !== fluidIngredient);
    }

    if (!fluidIngredientsWithAlts.length) {
      remaining.splice(i - 1, 1);
    }
  }

}






