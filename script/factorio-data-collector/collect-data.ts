import {
  applyDataUpdates,
  getDataUpdates,
  getItems,
  getRecipes
} from './game-data/collector.ts';
import { applyItemWeights, getEnrichedItems } from './enrich/enrich.ts';

export async function collectData(config?: {withIconPaths: boolean}) {
  let items = await getItems();
  let recipes = await getRecipes();

  // Factorio Space Age modifies base recipes (e.g. cliff-explosives require
  // calcite, quality-module-3 require superconductor, etc.)
  let dataUpdates = await getDataUpdates();
  applyDataUpdates(items, recipes, dataUpdates);

  // All item weights are not stated in factorio-data, but instead are
  // calculated from the item's recipe weight
  applyItemWeights(items, recipes);

  // Re-model data into Rocket-Capacitator data structures
  let enrichedItems = getEnrichedItems(items, recipes, config?.withIconPaths);
  return enrichedItems;
}
