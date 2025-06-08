/**
 * Utility for handling concurrent Adobe Commerce API requests with rate limiting and retries
 * @module lib/api/concurrency
 */

/**
 * Process an array of API requests with controlled concurrency and retry logic
 * @template T, R
 * @param {T[]} items - Array of items to process with API requests
 * @param {function(T): Promise<R>} processor - Async function to make API request for each item
 * @param {Object} options - Processing options
 * @param {number} [options.concurrency=3] - Maximum number of concurrent API requests
 * @param {number} [options.retries=2] - Number of retries for failed API requests
 * @param {number} [options.retryDelay=1000] - Delay between retries in milliseconds
 * @returns {Promise<R[]>} Array of API response results
 */
async function processConcurrently(items, processor, options = {}) {
  const { concurrency = 3, retries = 2, retryDelay = 1000 } = options;

  const results = [];
  const errors = [];

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item, index) => {
      let lastError;

      // Retry logic for failed API requests
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await processor(item);
          results[i + index] = result;
          return;
        } catch (error) {
          lastError = error;
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // If all retries failed, store the API error
      errors.push({ item, error: lastError });
    });

    // Wait for current batch of API requests to complete
    await Promise.all(batchPromises);
  }

  // If there were any API errors, throw with details
  if (errors.length > 0) {
    const errorMessage = errors
      .map(
        ({ item, error }) => `Failed API request for item ${JSON.stringify(item)}: ${error.message}`
      )
      .join('\n');
    throw new Error(`Some API requests failed:\n${errorMessage}`);
  }

  return results;
}

module.exports = {
  processConcurrently,
};
