export type ExpressionTypes =
  | 'TableKeyString'
  | 'NumericLiteral'
  | 'StringLiteral'
  | 'BooleanLiteral'
  | 'TableConstructorExpression'
  | 'TableValue'
  | 'MemberExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'

export type LexLocation = {
  line: number
  column: number
}

export type LexLocationRange = {
  start: LexLocation
  end: LexLocation
}

export type ExpressionValue =
  | StringLiteralValue
  | NumericLiteralValue
  | TableConstructorExpressionValue
  | BinaryExpressionValue
  | IdentifierValue
  | BooleanLiteralValue
  | UnaryExpressionValue

export type Expression = {
  type: ExpressionTypes
  value: ExpressionValue
  loc?: LexLocationRange
}

export type TableConstructorExpressionValue = {
  type: 'TableConstructorExpression'
  fields: (
    | TableValue
    | TableKeyString
    )[]
  loc?: LexLocationRange
}
export function isTableConstructorExpression(it: Expression)
  : it is TableConstructorExpressionValue {
  return it.type === 'TableConstructorExpression';
}

type TableKey = {
  type: 'Identifier'
  name: string
  loc?: LexLocationRange
}

type TableValue = {
  type: 'TableValue'
  value: TableConstructorExpressionValue
  loc?: LexLocationRange
}
export function isTableValue(it: Expression)
  : it is TableValue {
  return it.type === 'TableValue';
}

// myVar
type BooleanLiteralValue = {
  type: 'BooleanLiteral'
  value: boolean
  raw: string
  loc?: LexLocationRange
}
export function isBooleanLiteralValue(it: ExpressionValue)
  : it is BooleanLiteralValue {
  return it.type === 'BooleanLiteral';
}

// myVar
type IdentifierValue = {
  type: 'Identifier'
  name: string
  loc?: LexLocationRange
}
export function isIdentifierValue(it: ExpressionValue)
  : it is IdentifierValue {
  return it.type === 'Identifier';
}

// "stone-bricks"
type StringLiteralValue = {
  type: 'StringLiteral'
  value: null
  raw: string
  loc?: LexLocationRange
}
export function isStringLiteral(it: ExpressionValue): it is StringLiteralValue {
  return it.type === 'StringLiteral';
}

// 42
type NumericLiteralValue = {
  type: 'NumericLiteral'
  value: number
  raw: string
  loc?: LexLocationRange
}
export function isNumericLiteral(it: ExpressionValue): it is NumericLiteralValue {
  return it.type === 'NumericLiteral';
}

// value <- operator -> value
type BinaryExpressionSide =
  | NumericLiteralValue
  | IdentifierValue
type BinaryExpressionValue = {
  type: 'BinaryExpression'
  operator: string
  left: BinaryExpressionSide
  right: BinaryExpressionSide
  loc?: LexLocationRange
}
export function isBinaryExpression(it: ExpressionValue): it is BinaryExpressionValue {
  return it.type === 'BinaryExpression';
}

// value <- operator -> value
type UnaryExpressionValue = {
  type: 'UnaryExpression'
  operator: string
  argument: NumericLiteralValue
  loc?: LexLocationRange
}
export function isUnaryExpression(it: ExpressionValue): it is UnaryExpressionValue {
  return it.type === 'UnaryExpression';
}

// myKey = someValue
export type TableKeyString = {
  type: 'TableKeyString'
  key: TableKey
  value: ExpressionValue
  loc?: LexLocationRange
}
export function isTableKeyString(it: Expression): it is TableKeyString {
  return it.type === 'TableKeyString';
}
