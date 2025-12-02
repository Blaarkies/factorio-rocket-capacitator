import type { EnrichedItem } from './enrich/type.ts';
import { collectData } from './collect-data.ts';

/**
 * Basic sanity tests to help development debugging
 */

(async () => {
  let enrichedItems = await collectData();

  let capResults = testItemsRocketCap(enrichedItems);
  let recipeResults = testItemsRecipe(enrichedItems);

  let failedCapTests = capResults.failed;
  let failedRecipeTests = recipeResults.failed;

  let fails = failedCapTests.concat(failedRecipeTests);
  let passes = capResults.passed.concat(recipeResults.passed);

  if (failedCapTests.length) {
    console.log(`Rocket capacity tests (${failedCapTests.length})`);
    failedCapTests.forEach(([name, message]) =>
      console.error('❌', name, message));
    console.log('');
  }

  if (failedRecipeTests.length) {
    console.log(`Recipe contents tests (${failedRecipeTests.length})`);
    failedRecipeTests.forEach(([name, message]) =>
      console.error('❌', name, message));
    console.log('');
  }

  passes.forEach(name => console.log('✅', name));

  if (fails.length) {
    console.error(`\n${fails.length} test(s) failed\n`);
    process.exit(1);
  }

  console.log('All tests passed');
})();

let correctRocketCaps = [
  ['flying-robot-frame', 150],
  ['electronic-circuit', 2000],
  ['repair-pack', 100],
  ['construction-robot', 50],
  ['electric-engine-unit', 400],
  ['processing-unit', 300],
  ['iron-plate', 1000],
  ['iron-ore', 500],
  ['battery', 400],
  ['steel-plate', 400],
  ['artillery-shell', 10],
  ['cliff-explosives', 20],
  ['artillery-turret', 5],
];

function testItemsRocketCap(items: EnrichedItem[]): TestResult {
  let results = {
    passed: [],
    failed: [],
  };
  for (let test of correctRocketCaps) {
    let [testName, testRc] = test as [string, number];
    let testee = items.find(i => i.name === testName);

    let isPass = test[1] === testee.rocketCapacity;

    if (!isPass) {
      results.failed.push([
        testName,
        `\n\tExpected ${testRc}`
        + `\n\tReceived ${testee.rocketCapacity}`,
      ]);
      continue;
    }

    results.passed.push(testName);
  }
  return results;
}

let correctIngredients = [
  ['cliff-explosives', [
    {name: 'explosives', amount: 10},
    {name: 'calcite', amount: 10},
    {name: 'grenade', amount: 1},
    {name: 'barrel', amount: 1}
  ]],
  ['atomic-bomb', [
    {name: 'processing-unit', amount: 10},
    {name: 'explosives', amount: 10},
    {name: 'uranium-235', amount: 100}, // 30 in base vanilla
  ]],
  ['productivity-module-3', [
    {name: 'productivity-module-2', amount: 4},
    {name: 'advanced-circuit', amount: 5},
    {name: 'processing-unit', amount: 5},
    {name: 'biter-egg', amount: 1}
  ]],
];

function ingredientsToString(ingredients: {
  name: string;
  amount: number
}[]): string {
  return ingredients
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(i => `${i.amount.toString().padStart(3)}x ${i.name}`)
    .join(' + ');
}

type TestResult = {
  passed: string[];
  failed: [string, string][]
};

function testItemsRecipe(items: EnrichedItem[]): TestResult {
  let results = {
    passed: [],
    failed: [],
  };
  for (let test of correctIngredients) {
    let [testName, testIngredients]
      = test as [string, { name: string, amount: number }[]];
    let testIngredientsString = ingredientsToString(testIngredients);

    let testee = items.find(i => i.name === testName);
    let testeeIngredientsStrings = testee.alternatives
      .map(alt => ingredientsToString(alt.ingredients));

    let isPass = testeeIngredientsStrings.some(ingString =>
      testIngredientsString === ingString);

    if (!isPass) {
      results.failed.push([
        testName,
        `\n\tExpected ${testIngredientsString}`
        + `\n\tReceived ${testeeIngredientsStrings.join('\n\t| ')}`,
      ]);
      continue;
    }

    results.passed.push(testName);
  }
  return results;
}
