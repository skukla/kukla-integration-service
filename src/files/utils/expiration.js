/**
 * Expiration Utilities
 *
 * Shared utilities for handling expiration calculations and validation.
 * Eliminates duplication across presigned URL functions.
 */

/**
 * Calculate expiration timestamp from duration
 * Utility function to standardize expiration calculations.
 *
 * @param {number} expiresIn - Expiration duration in seconds
 * @returns {Date} Expiration timestamp
 */
function calculateExpirationDate(expiresIn) {
  return new Date(Date.now() + expiresIn * 1000);
}

/**
 * Create expiration info object
 * Standardized expiration information for consistent responses.
 *
 * @param {number} expiresIn - Expiration duration in seconds
 * @returns {Object} Expiration information with timestamp and ISO string
 */
function createExpirationInfo(expiresIn) {
  const expiresAt = calculateExpirationDate(expiresIn);

  return {
    expiresIn,
    expiresAt: expiresAt.toISOString(),
    expiresAtTimestamp: expiresAt.getTime(),
  };
}

/**
 * Check if expiration timestamp is still valid
 * Utility for validating expiration timestamps.
 *
 * @param {string|number} expiresAt - ISO string or timestamp
 * @returns {Object} Validation result with remaining time
 */
function validateExpiration(expiresAt) {
  const now = new Date();
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : new Date(expiresAt);
  const isExpired = now >= expiration;
  const timeRemaining = Math.max(0, expiration.getTime() - now.getTime());

  return {
    isExpired,
    timeRemaining, // milliseconds
    timeRemainingSeconds: Math.floor(timeRemaining / 1000),
    expiresAt: expiration.toISOString(),
  };
}

module.exports = {
  calculateExpirationDate,
  createExpirationInfo,
  validateExpiration,
};
