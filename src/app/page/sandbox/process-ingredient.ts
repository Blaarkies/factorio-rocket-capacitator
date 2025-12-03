import { Alternative, EnrichedItem } from '@script/enrich/type';
import { EnrichedAlternative } from '@app/page/sandbox/sandbox/type';
import { camelCaseTo } from '@app/common/function/string';

export function getEnrichedAlternative(
  recipe: Alternative, nameItemMap: Map<string, EnrichedItem>)
  : EnrichedAlternative {
  let ingredients = recipe.ingredients.map(i => {
    let ingredientDetails = nameItemMap.get(i.name);
    let ingredientRocketCapacity
      = i.weightRatio * ingredientDetails.rocketCapacity;
    return {
      ...i,
      ingredientRocketCapacity,
    };
  });

  let sample = ingredients[0];
  let craftCount = sample
    ? recipe.yield * sample.ingredientRocketCapacity / sample.amount
    // biter-egg recipe has 0 ingredients, so use the recipe yield instead
    : recipe.yield;

  let craftedOnlyOn = recipe.craftedOnlyOn
    ? camelCaseTo(recipe.craftedOnlyOn, 'title case')
    : undefined;

  return {
    ...recipe,
    craftCount,
    ingredients,
    craftedOnlyOn,
  } as EnrichedAlternative;
}

