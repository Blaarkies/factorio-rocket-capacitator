import { ValidProp } from '../type';

// Item properties to keep
export const requiredItemProperties: ValidProp[] = [
  'type',
  'name',
  'subgroup',
  'stack_size',
  'hidden',
  'weight',
  'ingredient_to_weight_coefficient',
  'fuel_category',
  'fuel_value',
];

// Properties that need to be evaluated to number
// e.g. `2 * kg` or `1 * tons / 3 / 3` or `2MJ`
const numberFields = new Set<ValidProp>([
  'weight',
  'stack_size',
  'ingredient_to_weight_coefficient',
  'fuel_value'
]);

export function processItem(entry: [ValidProp, string])
  : [ValidProp, number | string] {
  let [key, value] = entry;
  if (!numberFields.has(key)) {
    return entry;
  }

  let n = Number(value);
  if (!Number.isNaN(n)) {
    return [key, n];
  }

  /** (\d+) – captures digits
   (?=[A-Za-z]) – is followed by a letter?
   ([A-Za-z]+) – captures unit letters (MJ, kJ, GJ) */
  let cleanValue = key === 'fuel_value'
    ? value.replace(/(\d+)(?=[A-Za-z])([A-Za-z]+)/g, '$1*$2')
    : value;

  let result = new Function(
    `let [grams, kg, tons,
            kJ, MJ, GJ] = [1e-3, 1, 1e3,
                          1e3, 1e6, 1e9];
       return ${cleanValue};`)();

  return [key, Number(result)];
}
