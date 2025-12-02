/** Describes a Factorio item */
export type EnrichedItem = {
  type: string
  name: string
  subgroup: string
  stackSize: number
  rocketCapacity: number
  alternatives: Alternative[]
  icon?: string
}

/** Resembles a recipe with info to scale up to a full rocket payload */
export type Alternative = {
  name: string
  yield: number;
  ingredients: EnrichedIngredient[]
  // results: (Ingredient & {probability?: number})[]
}

/** Ingredient with the weight ratio to the total weight of this recipe.
 * e.g. if this ingredient has `weightRatio=0.5`, it takes up half the weight of this recipe, and also half the rocket payload if this recipe was scaled up to fill the payload */
export type EnrichedIngredient = {
  name: string
  amount: number
  weightRatio: number
}
