/**
 * Worker pool pattern for concurrent processing with shared index management.
 *
 * @module concurrency
 */

/**
 * Processes items concurrently using a worker pool pattern.
 *
 * @param items - Array of items to process.
 * @param concurrency - Maximum number of concurrent workers.
 * @param fn - Async function to apply to each item.
 * @returns Array of results in the same order as the input items.
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  /** Pulls items from the shared index and processes them sequentially. */
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
