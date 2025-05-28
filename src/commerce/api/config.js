/**
 * Adobe Commerce API configuration
 * @module commerce/api/config
 */

/**
 * Commerce API configuration constants
 * @constant {Object}
 */
const COMMERCE_CONFIG = {
    REQUEST_TIMEOUT: 30000,    // 30 second timeout
    RETRY_ATTEMPTS: 3,         // Number of retry attempts
    RETRY_DELAY: 1000,        // Base delay between retries (ms)
    BATCH_SIZE: 50,           // Maximum items per batch
    CACHE_DURATION: 300       // Cache duration for GET requests (5 minutes)
};

module.exports = {
    COMMERCE_CONFIG
}; 