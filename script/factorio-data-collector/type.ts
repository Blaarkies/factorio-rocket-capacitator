export const EOL = '\n';

export type ValidProp =
  | 'type'
  | 'name'
  | 'subgroup'
  | 'stack_size'
  | 'hidden'
  | 'weight'
  | 'ingredient_to_weight_coefficient'
  | 'fuel_category'
  | 'fuel_value'

  | 'category'
  | 'ingredients'
  | 'energy_required'
  | 'results'
  | 'allow_productivity'
  | 'temperature'
  | 'amount'


export type ItemInJson = Record<ValidProp, string>;

export type FactorioItem = {
  name: string;
  type: string;
  subgroup: string;
  rocketCapacity: number;
};
