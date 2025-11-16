export function randomNumber(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function hash(it: ArrayLike<number> | ArrayBuffer): number {
  const view = it instanceof ArrayBuffer
    ? new Uint8Array(it)
    : Uint8Array.from(it);

  let hash = 5381;
  let count = view.length;

  for (let i = 0; i < count; ++i) {
    hash = ((hash << 5) + hash) ^ view[i];
    hash |= 0;
  }

  return hash;
}
