export function makeNumberList(count: number, offset: number = 0): number[] {
  let safeCount = Math.round(count);
  let list = Array.from(Array(safeCount).keys());
  return offset
         ? list.map(n => n + offset)
         : list;
}

export function pickRandomElement<T>(list: T[]): T {
  let randomIndex = Math.round(Math.random() * (list.length - 1));
  return list[randomIndex];
}


export function distinct<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}

/** Returns the first `fn` transformed result that is truthy.
 * Equivalent to Array.find(), but this returns the callback value
 * instead of the element */
export function mapFirstTruthy<T, U>(
  list: T[],
  fn: (value: T, index: number, array: T[]) => U,
): U {
  for (let i = 0; i < list.length; i++) {
    let result = fn(list[i], i, list);
    if (result) {
      return result;
    }
  }
  return null;
}
