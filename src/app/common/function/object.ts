export function assignSafe<T extends {}, U>(target: T, source: U): T & U {
  return Object.assign({}, target, source);
}
