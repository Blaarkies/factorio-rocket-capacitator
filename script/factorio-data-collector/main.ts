import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLua } from './parser/parse-lua';
import { processItem, requiredItemProperties } from './parser/parse-item';
import { processRecipe, requiredRecipeProperties } from './parser/parse-recipe';

process.chdir('../..');
console.log('CWD: ', process.cwd());

let gitFD = 'assets/';
let itemB = gitFD + 'base/prototypes/item.lua';
let itemSA = gitFD + 'space-age/prototypes/item.lua';
let recipeB = gitFD + 'base/prototypes/recipe.lua';
let recipeSA = gitFD + 'space-age/prototypes/recipe.lua';


type Item = {}
function readItems(path: string): Item[] {
  let content = readFileSync(path, 'utf8');
  return parseLua(content, requiredItemProperties, processItem);
}


type Recipe = {}
function readRecipes(path: string): Recipe[] {
  let content = readFileSync(path, 'utf8');
  return parseLua(content, requiredRecipeProperties, processRecipe);
}

let items = [itemB, itemSA].flatMap(p => readItems(p))
  .filter(i => !i.hidden).sort((a,b) => (a.weight ?? 0) - (b.weight ?? 0));
let recipes = [recipeB, recipeSA].flatMap(p => readRecipes(p));



console.log(items);
console.log(recipes);


// writeFileSync(join(gitFD, 'items.json'),
//   JSON.stringify(items, null, 2)
//   , 'utf8');
// writeFileSync(join(gitFD, 'recipes.json'),
//   JSON.stringify(recipes, null, 2)
//   , 'utf8');

// let result = parseLuaV2(contents);
// result.filter(i => !i.hidden).sort((a,b) => (a.weight ?? 0) - (b.weight ?? 0))


