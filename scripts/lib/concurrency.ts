/**
 * Processes items concurrently using a worker pool pattern.
 *
 * Args:
 *     items: Array of items to process.
 *     concurrency: Maximum number of concurrent workers.
 *     fn: Async function to apply to each item.
 *
 * Returns:
 *     Array of results in the same order as the input items.
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}
