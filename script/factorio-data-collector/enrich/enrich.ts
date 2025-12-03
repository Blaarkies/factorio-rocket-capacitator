import type {
  Alternative,
  EnrichedItem,
  EnrichedIngredient,
  SurfaceName
} from './type.ts';
import type { FactorioItem, FactorioRecipe } from '../game-data/type.ts';
import { sum } from '../common/math.ts';

let defaultItemWeight = 100;
export let rocketLiftWeight = 1e6;
let defaultIngredientToWeightCoefficient = .5;

export function applyItemWeights(
  items: FactorioItem[], recipes: FactorioRecipe[]) {

  let {itemRecipeMap, itemNameMap} = getItemRecipeMaps(items, recipes);

  let remaining = items.filter(i => !i.weight);
  let i = 0;
  while (remaining.length) {
    if (i > remaining.length - 2) {
      i = 0;
    }

    let item = remaining[i++];
    let weight = calculateWeight(item, itemRecipeMap, itemNameMap);

    if (weight !== undefined) {
      item.weight = weight;
      remaining.splice(i - 1, 1);
    }
  }

  return items;
}

/**
 * Calculations according to:
 * https://lua-api.factorio.com/latest/auxiliary/item-weight.html#algorithm
 */
function calculateWeight(
  item: FactorioItem,
  itemRecipeMap: Map<string, FactorioRecipe[]>,
  itemNameMap: Map<string, FactorioItem>,
): number | undefined {
  // TODO: if ("only-in-cursor" and "spawnable" flags) set to default

  if (!itemRecipeMap.has(item.name)) {
    // Not listed in items
    return defaultItemWeight;
  }

  let recipes = itemRecipeMap.get(item.name);
  if (!recipes.length) {
    // Has no recipes (e.g. uranium-ore)
    return defaultItemWeight;
  }

  // only use 1st recipe for calculation
  let recipe = recipes[0];
  let isReady = recipe.ingredients
    .filter(i => i.type !== 'fluid')
    .every(i => itemNameMap.get(i.name).weight);
  if (!isReady) {
    // Cannot calculate this yet, will retry it next time when ingredients
    // have defined weights
    return;
  }

  /** Next, an intermediate result will be determined as
   * (recipe_weight / product_count) * ingredient_to_weight_coefficient
   * (see ingredient_to_weight_coefficient, which defaults to 0.5). */
  let weights = recipe.ingredients.map(i => {
    let weight = i.type === 'fluid' ? 100 : itemNameMap.get(i.name).weight;
    return i.amount * weight;
  });
  let totalWeight = sum(weights);
  let itemYieldPerCraft = recipe.results
    .find(r => r.name === item.name)
    .amount;
  let coefficient = item.ingredient_to_weight_coefficient
    || defaultIngredientToWeightCoefficient;
  let intermediateResult = (totalWeight / itemYieldPerCraft) * coefficient;

  if (!recipe.allow_productivity) {
    /** Following this, if a recipe doesn't support productivity, its simple result is determined as
     * rocket_lift_weight / stack_size
     * (see rocket_lift_weight and stack_size). If this simple result is larger than or equal to the intermediate result, it becomes the item's weight.*/
    let simpleResult = rocketLiftWeight / item.stack_size;
    return simpleResult > intermediateResult
      ? simpleResult
      : intermediateResult;
  }

  /** Otherwise, the game determines the amount of stacks that would result from the intermediate result as
   * rocket_lift_weight / intermediate_result / stack_size
   * If this amount is less than or equal to 1, the intermediate result becomes the item's weight. Else, the item's weight is set to
   * rocket_lift_weight / floor(stack_amount) / stack_size */
  let stackAmount = rocketLiftWeight
    / intermediateResult
    / item.stack_size;

  return stackAmount <= 1
    ? intermediateResult
    : rocketLiftWeight / Math.floor(stackAmount) / item.stack_size;
}

type ItemRecipeMaps = {
  itemRecipeMap: Map<string, FactorioRecipe[]>,
  itemNameMap: Map<string, FactorioItem>
};

function getItemRecipeMaps(items: FactorioItem[], recipes: FactorioRecipe[])
  : ItemRecipeMaps {
  let itemNameMap = new Map<string, FactorioItem>(
    items.map(it => [it.name, it]));

  let itemRecipeMap = new Map<string, FactorioRecipe[]>(
    items.map(it => [it.name, []]));

  let validRecipes = recipes.filter(recipe =>
    recipe.results.some(i => itemNameMap.has(i.name)));

  for (let recipe of validRecipes) {
    for (let result of recipe.results) {
      if (!itemRecipeMap.has(result.name)) {
        continue;
      }
      itemRecipeMap.get(result.name).push(recipe);
    }
  }

  return {itemRecipeMap, itemNameMap};
}

/** Convert the raw game data models into cleaner minimalistic models for FE */
export function getEnrichedItems(
  items: FactorioItem[],
  recipes: FactorioRecipe[],
  withIconPaths: boolean): EnrichedItem[] {

  let {itemRecipeMap, itemNameMap} = getItemRecipeMaps(items, recipes);

  let enriched = itemRecipeMap.entries().toArray()
    .map(([itemName, recipes]) => {
      let alternatives = getAlternatives(recipes, itemName, itemNameMap);

      let item = itemNameMap.get(itemName);
      let enrichedItem: EnrichedItem = {
        type: item.type,
        name: item.name,
        subgroup: item.subgroup,
        icon: withIconPaths ? item.icon : undefined,
        stackSize: item.stack_size,
        rocketCapacity: rocketLiftWeight / item.weight,
        alternatives,
      };

      return enrichedItem;
    });

  return enriched;
}

function getEnrichedIngredients(recipe: FactorioRecipe,
                                itemNameMap: Map<string, FactorioItem>)
  : EnrichedIngredient[] {
  let ingredientsTotalWeight = sum(
    recipe.ingredients.map(i =>
      i.amount * itemNameMap.get(i.name).weight));

  let ingredients: EnrichedIngredient[] = recipe.ingredients
    .map(ingredient => {
      let weight = ingredient.amount
        * itemNameMap.get(ingredient.name).weight;
      let weightRatio = weight / ingredientsTotalWeight;
      return {
        name: ingredient.name,
        amount: ingredient.amount,
        weightRatio,
      };
    });
  return ingredients;
}

function getAlternatives(recipes: FactorioRecipe[],
                         itemName: string,
                         itemNameMap: Map<string, FactorioItem>) {
  let alternatives: Alternative[] = recipes
    // For removing fluid alternatives that cannot be barreled
    .filter(r => r.ingredients.every(i => itemNameMap.has(i.name)))
    .map(recipe => {
      let results = recipe.results
        .find(result => result.name === itemName);
      let itemYield = (results.probability ?? 1) * results.amount;

      let ingredients = getEnrichedIngredients(recipe, itemNameMap);

      return {
        name: recipe.name,
        yield: itemYield,
        ingredients,
        craftedOnlyOn: getCraftSurfaceCondition(recipe),
      };
    });
  return alternatives;
}

function getCraftSurfaceCondition(recipe: FactorioRecipe)
  : SurfaceName | undefined {
  let condition = recipe.surface_conditions?.[0];
  if (!condition) {
    return undefined;
  }

  if (condition.property === 'magnetic-field') {
    return 'fulgora';
  }

  if (condition.property === 'gravity') {
    return 'space';
  }

  if (condition.property === 'pressure') {
    return condition.max === 4000
      ? 'vulcanus'
      : condition.max === 2000
        ? 'gleba'
        : condition.min === 1000
          ? 'nauvis'
          : 'aquilo';
  }
}
