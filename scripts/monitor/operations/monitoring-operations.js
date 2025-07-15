/**
 * Monitoring Operations
 * Core monitoring functionality for Adobe Target URL expiration
 */

const { loadConfig } = require('../../../config');
const { generateFileAccessUrl } = require('../../../src/files/utils/access-patterns');

/**
 * Check Adobe Target URL expiration status
 * @param {Object} options - Monitoring options
 * @param {string} options.fileName - File to check (default: 'products.csv')
 * @param {string} options.useCase - Use case to check (default: 'adobeTarget')
 * @returns {Object} Monitoring result with status and timing information
 */
async function checkUrlExpiration(options = {}) {
  const { fileName = 'products.csv', useCase = 'adobeTarget' } = options;

  const config = loadConfig({});
  const params = {}; // No specific action parameters needed

  // Generate URL to check expiration
  const result = await generateFileAccessUrl(fileName, useCase, config, params);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      fileName,
      useCase,
    };
  }

  const now = new Date();
  const expiresAt = new Date(result.expiresAt);
  const millisecondsUntilExpiry = expiresAt.getTime() - now.getTime();
  const daysUntilExpiry = millisecondsUntilExpiry / (1000 * 60 * 60 * 24);
  const hoursUntilExpiry = millisecondsUntilExpiry / (1000 * 60 * 60);

  return {
    success: true,
    fileName,
    useCase,
    url: result.url,
    generatedAt: now,
    expiresAt,
    daysUntilExpiry,
    hoursUntilExpiry,
    method: result.method,
    urlType: result.urlType,
  };
}

/**
 * Determine alert level based on days until expiry
 * @param {number} daysUntilExpiry - Days until URL expires
 * @returns {Object} Alert level and exit code
 */
function getAlertLevel(daysUntilExpiry) {
  if (daysUntilExpiry < 1) {
    return {
      level: 'critical',
      emoji: '🚨',
      title: 'CRITICAL ALERT',
      exitCode: 2,
    };
  } else if (daysUntilExpiry < 2) {
    return {
      level: 'warning',
      emoji: '⚠️',
      title: 'WARNING',
      exitCode: 1,
    };
  } else if (daysUntilExpiry < 3) {
    return {
      level: 'notice',
      emoji: '💛',
      title: 'NOTICE',
      exitCode: 0,
    };
  } else {
    return {
      level: 'ok',
      emoji: '✅',
      title: 'STATUS: OK',
      exitCode: 0,
    };
  }
}

/**
 * Generate monitoring report
 * @param {Object} monitorResult - Result from checkUrlExpiration
 * @returns {Object} Formatted monitoring report
 */
function generateMonitoringReport(monitorResult) {
  if (!monitorResult.success) {
    return {
      success: false,
      error: monitorResult.error,
      type: 'error',
    };
  }

  const alert = getAlertLevel(monitorResult.daysUntilExpiry);

  return {
    success: true,
    type: 'report',
    alert,
    data: {
      fileName: monitorResult.fileName,
      useCase: monitorResult.useCase,
      url: monitorResult.url,
      generatedAt: monitorResult.generatedAt,
      expiresAt: monitorResult.expiresAt,
      daysUntilExpiry: monitorResult.daysUntilExpiry,
      hoursUntilExpiry: monitorResult.hoursUntilExpiry,
      method: monitorResult.method,
      urlType: monitorResult.urlType,
    },
  };
}

module.exports = {
  checkUrlExpiration,
  getAlertLevel,
  generateMonitoringReport,
};
