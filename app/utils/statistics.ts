/**
 * The "mean" is the "average" you're used to, where you add up all the numbers
 * and then divide by the number of numbers.
 *
 * For example, the "mean" of [3, 5, 4, 4, 1, 1, 2, 3] is 2.875.
 */
export function mean(numbers: ArrayLike<number>): number {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i]!;
  }
  return total / numbers.length;
}

/**
 * The "median" is the "middle" value in the list of numbers.
 */
export function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }

  return sorted[middle]!;
}

/**
 * The "mode" is the number that is repeated most often.
 *
 * As the result can be bimodal or multi-modal, it is returned as an array.
 * For example, the "mode" of [3, 5, 4, 4, 1, 1, 2, 3] is [1, 3, 4].
 */
export function mode(numbers: number[]): number[] {
  const counts = new Map<number, number>();
  let maxCount = 0;

  for (const number of numbers) {
    const count = (counts.get(number) ?? 0) + 1;
    counts.set(number, count);
    maxCount = Math.max(maxCount, count);
  }

  return [...counts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([number]) => number)
    .sort((a, b) => a - b);
}

/**
 * Returns the most frequently occurring string in the array.
 */
export function modeString<T extends string>(arr: T[]): T | undefined {
  return [...arr]
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length,
    )
    .pop();
}
