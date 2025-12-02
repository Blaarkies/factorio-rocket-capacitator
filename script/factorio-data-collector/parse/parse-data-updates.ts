import { parseExpression, parseLua } from './parse-lua.ts';

function getExpressionLine(e) {
  let lineId = JSON.stringify(e, null, 1)
    .split('\n')
    .filter(l => ['"name"', '"raw"'].some(q => l.includes(q)))
    .map(l => l.split('"').slice(3, 4))
    .reverse()
    .join('.')
  return lineId;
}

function parseDataUpdates(ast: object[]) {
  let body = (ast as any).body;
  let expressions = body
    .map(e => {
      let lineId = getExpressionLine(e);

      let valid = ['recipe', 'ingredients'].some(q => lineId.includes(q))
        && !['technology', 'surface_conditions'].some(q => lineId.includes(q));
      return {valid, e};
    })
    .filter(({valid}) => valid)
    .map(({e}) => {
      if (e.type === 'CallStatement') {
        let value = parseExpression(e.expression.arguments[1]);
        let arg = e.expression.arguments[0];
        return {
          e,
          insert: {
            recipeName: arg.base.index.raw.replaceAll('"', ''),
            propertyName: arg.identifier.name,
            value,
            inserted: true,
          }
        };
      }
      return {e};
    })
    .map(({e, insert}) => {
      if (insert) {
        return insert;
      }

      let var1 = e.variables[0];
      let name = var1.type === 'IndexExpression'
        ? var1.base.base.index
        : var1.type === 'MemberExpression'
           ? var1.base.index ?? var1.base.identifier.name
           : var1.base.identifier.name;

      let recipeName = (name.raw ?? name).replaceAll('"', '');
      let propertyName = var1.identifier?.name
        ?? var1.base.identifier?.name;
      let value = parseExpression(e.init[0]);
      let indexed = var1.index?.value - 1;

      return {recipeName, propertyName, value, indexed};
    });

  return expressions;
}

export function parseDataUpdatesFromContent(content: string) {
  let ast = parseLua(content);

  let dataUpdates = parseDataUpdates(ast);
  return dataUpdates;
}
