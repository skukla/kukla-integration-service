/**
 * Shared Async Utilities
 * Cross-domain async utilities for timing, delays, and concurrency
 */

/**
 * Sleep for specified duration
 * @purpose Create a Promise-based delay for retry logic and timing control
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Resolves after delay
 * @usedBy Retry logic, rate limiting, testing utilities
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with timeout
 * @purpose Wrap any async function with a timeout limit
 * @param {Function} fn - Async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<any>} Result of function or timeout error
 * @usedBy HTTP requests, long-running operations
 */
async function withTimeout(fn, timeoutMs) {
  return Promise.race([
    fn(),
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Retry function with exponential backoff
 * @purpose Execute function with automatic retry and backoff logic
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.baseDelay - Base delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @returns {Promise<any>} Result of successful execution
 * @usedBy Network requests, external API calls
 */
async function retryWithBackoff(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await sleep(delay);
    }
  }
}

module.exports = {
  sleep,
  withTimeout,
  retryWithBackoff,
};
