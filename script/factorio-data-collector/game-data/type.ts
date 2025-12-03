export type FactorioItem = Partial<OptionalFactorioItem> & {
  type: 'item'
  name: string
  subgroup: string
  icon: string
  stack_size: number
}

type OptionalFactorioItem = {
  fuel_value: number // Joule
  fuel_category: string
  hidden: boolean
  weight: number // Gram
  ingredient_to_weight_coefficient: number
}

type SurfaceConditionMeasure =
  | 'gravity'
  | 'pressure'
  | 'magnetic-field'

type SurfaceCondition = {
  property: SurfaceConditionMeasure
  min: number
  max: number
}

export type FactorioRecipe = Partial<OptionalFactorioRecipe> & {
  type: string
  name: string
  energy_required: number
  ingredients: Ingredient[]
  results: (Ingredient & Result)[]
  surface_conditions?: SurfaceCondition[]
}

type OptionalFactorioRecipe = {
  allow_productivity: boolean
}

type Ingredient = {
  type: 'item' | 'fluid'
  name: string
  amount: number
}

type Result = {
  probability?: number
}
