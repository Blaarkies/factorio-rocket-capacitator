import { ValidProp } from '../type';
import { parse } from 'luaparse';
import {
  Expression,
  ExpressionValue,
  isBinaryExpression,
  isBooleanLiteralValue,
  isIdentifierValue,
  isNumericLiteral,
  isStringLiteral,
  isTableConstructorExpression,
  isTableKeyString,
  isTableValue, isUnaryExpression,
  LexLocationRange,
  TableKeyString
} from './type';

type Value = boolean | string | number | object;

function parseValue(expression: ExpressionValue): unknown {
  if (isStringLiteral(expression)) {
    return expression.raw.slice(1, -1);
  }

  if (isNumericLiteral(expression)) {
    return Number(expression.value);
  }

  if (isIdentifierValue(expression)) {
    return expression.name;
  }

  if (isBooleanLiteralValue(expression)) {
    return expression.value;
  }

  if (isBinaryExpression(expression)) {
    const left = parseValue(expression.left);
    const right = parseValue(expression.right);
    return left + expression.operator + right;
  }

  if (isUnaryExpression(expression)) {
    return expression.operator + parseValue(expression.argument);
  }

  return 'ERROR';
}

type EvaluatorFn = (entry: [ValidProp, string]) => [ValidProp, string | number]

function parseExpression(
  expression: Expression,
  filterKeys?: ValidProp[],
  evaluatorFn?: EvaluatorFn,
  )
  : object {
  if (isTableConstructorExpression(expression) || isTableValue(expression)) {
    const fields = isTableConstructorExpression(expression)
      ? expression.fields
      : expression.value.fields;
    const filteredFields = filterKeys
      ? fields.filter(f => isTableKeyString(f)
        ? filterKeys.includes((<TableKeyString>f).key.name as ValidProp)
        : true)
      : fields;

    if (isTableConstructorExpression(expression)) {
      const entriesOrObject = filteredFields
        .map(f => parseExpression(f, filterKeys, evaluatorFn));
      let isEntries = Array.isArray(entriesOrObject[0]);
      let r = isEntries
        ? Object.fromEntries(<[]>entriesOrObject)
        : entriesOrObject;
      return r;
    }

    if (isTableValue(expression)) {
      let r = filteredFields.map(f =>
        parseExpression(f, filterKeys, evaluatorFn)) as [string, Value][];
      if (evaluatorFn) {
        r = r.map(entry => {
          return typeof entry[1] === 'string'
            ? evaluatorFn(entry as [ValidProp, string])
            : entry;
        })
      }

      return Object.fromEntries(r);
    }
  }

  if (isTableKeyString(expression)) {
    const parsedValue = isTableConstructorExpression(expression.value)
      ? parseExpression(expression.value, filterKeys, evaluatorFn)
      : parseValue(expression.value);

    return [expression.key.name, parsedValue];
  }

  return {error: 'ERROR' + JSON.stringify(expression)};
}

export function parseLua(
  contents: string,
  filterKeys?: ValidProp[],
  evaluatorFn?: EvaluatorFn,
): object[] {
  let expressionContents = contents.split(/data:extend\s?\(/g).at(-1);
  let end = expressionContents.lastIndexOf(')');
  let listSection = expressionContents.slice(0, end);
  let fragileContents = `ignoreThis=${listSection}`;

  let ast = parse(fragileContents, {locations: true});

  let dataTable = ast.body[0].init[0];

  let items = parseExpression(
    {
      type: 'TableConstructorExpression',
      fields: dataTable.fields,
      loc: dataTable.loc,
    },
    filterKeys,
    evaluatorFn,
  );

  return items;
}




function processRecipes() {

}


let latestContents: string;

function setContents(contents: string) {
  latestContents = contents;
}

function getContentsAt(location: LexLocationRange): string {
  let {start, end} = location;
  let sections = latestContents.slice(-1 + start.line, end.line);

  if (sections.length === 1) {
    return sections[0].slice(start.column, end.column);
  }

  let first = sections[0].slice(start.column);
  let last = sections.at(-1).slice(0, end.column);

  let raw = [first, ...sections.slice(1, -1), last].join('\n');
  return raw;
}
