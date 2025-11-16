export function enumToList<T>(it: T): [string, T][] {
  const doubleEntries = Object.entries(it);
  return doubleEntries.slice(Math.floor(doubleEntries.length / 2));
}
