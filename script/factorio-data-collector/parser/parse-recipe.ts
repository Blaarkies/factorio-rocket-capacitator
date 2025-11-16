import { ValidProp } from '../type';

// Item properties to keep
export const requiredRecipeProperties: ValidProp[] = [
  'type',
  'name',
  'category',
  'subgroup',
  'ingredients',
  'energy_required',
  'results',
  'amount',
  'allow_productivity',
  'temperature',
];

// Properties that need to be evaluated to number
// e.g. `-150` temperature
const numberFields = new Set<ValidProp>([
  'temperature',
]);

export function processRecipe(entry: [ValidProp, string])
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
