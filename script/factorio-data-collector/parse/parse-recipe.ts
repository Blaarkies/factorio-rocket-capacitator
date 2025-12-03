import type { ValidProp } from './type-data.js';
import type { FactorioRecipe } from '../game-data/type.ts';
import { parseLuaItemsOrRecipes } from './parse-lua.ts';
import { getDataExtendSection } from './lua-file-content-extract.ts';

// Properties to keep
const requiredProperties: ValidProp[] = [
  'type',
  'name',
  'category',
  'subgroup',
  'ingredients',
  'energy_required',
  'results',
  'probability',
  'amount',
  'allow_productivity',
  'temperature',
  'surface_conditions',
  'property',
  'min',
  'max',
];

// Properties that need to be evaluated to number
// e.g. `-150` temperature
const numberFields = new Set<ValidProp>([
  'temperature',
]);

function processRecipe(entry: [ValidProp, string])
  : [ValidProp, number | string] {
  let [key, value] = entry;
  if (!numberFields.has(key)) {
    return entry;
  }

  let n = Number(value);
  if (!Number.isNaN(n)) {
    return [key, n];
  }

  let result = new Function(`return ${value};`)();

  return [key, Number(result)];
}

export function parseRecipesFromContent(content: string): FactorioRecipe[] {
  let fragileContents = getDataExtendSection(content);
  return parseLuaItemsOrRecipes(
    fragileContents,
    requiredProperties,
    processRecipe) as FactorioRecipe[];
}
