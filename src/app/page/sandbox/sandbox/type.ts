import {
  Alternative,
  EnrichedIngredient,
  EnrichedItem
} from '@script/enrich/type'

export type { EnrichedItem, Alternative } from '@script/enrich/type'

type CalculatedIngredient = EnrichedIngredient & {
  ingredientRocketCapacity: number
};
export type EnrichedAlternative = Alternative & {
  craftCount: number
  ingredients: CalculatedIngredient[]
  craftedOnlyOn?: string
}

export type EnrichedItemWithEnrichedAlternatives = EnrichedItem & {
  enrichedAlternatives: EnrichedAlternative[];
}
