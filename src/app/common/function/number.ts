export function coerceAtLeast(it: number, threshold: number = 0): number {
  return Math.max(it, threshold);
}

export function coerceAtMost(it: number, threshold: number = 0): number {
  return Math.min(it, threshold);
}

export function coerceIn(it: number, lower: number = 0, upper: number = 1): number {
  if (lower > upper) {
    throw new Error(`CoerceIn function requires that lower [${lower}] must be less than or equal to upper [${upper}]`);
  }
  return Math.min(Math.max(lower, it), upper);
}


/** Uses bit-masking to determine if a given button is included in the value */
const mouseButtonNames = ['left', 'right', 'wheel', 'back', 'forward'] as const;
export function mouseButtonPressed(
  buttonsPressed: number,
  name: typeof mouseButtonNames[number],
): boolean {
  // Use binary `&` with the relevant power of 2 to check if a given button is pressed
  return Boolean(buttonsPressed & (1 << mouseButtonNames.indexOf(name)));
}
