/**
 * Adobe Target URL Monitoring Workflow
 * High-level workflow for monitoring URL expiration
 */

const {
  checkUrlExpiration,
  generateMonitoringReport,
} = require('../operations/monitoring-operations');
const { formatMonitoringOutput } = require('../operations/monitoring-output');

/**
 * Execute Adobe Target URL monitoring workflow
 * @param {Object} options - Monitoring options
 * @param {string} options.fileName - File to monitor
 * @param {string} options.useCase - Use case to monitor
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Object} Workflow result with success status and exit code
 */
async function executeTargetMonitoring(options = {}) {
  const { fileName = 'products.csv', useCase = 'adobeTarget', verbose = true } = options;

  try {
    // Step 1: Check URL expiration status
    const monitorResult = await checkUrlExpiration({ fileName, useCase });

    // Step 2: Generate monitoring report
    const report = generateMonitoringReport(monitorResult);

    // Step 3: Format and display output
    if (verbose) {
      formatMonitoringOutput(report);
    }

    // Return result for programmatic use
    return {
      success: report.success,
      report,
      exitCode: report.success ? report.alert.exitCode : 1,
    };
  } catch (error) {
    const errorReport = {
      success: false,
      type: 'error',
      error: {
        message: error.message,
        name: error.name,
      },
    };

    if (verbose) {
      formatMonitoringOutput(errorReport);
    }

    return {
      success: false,
      report: errorReport,
      exitCode: 1,
    };
  }
}

module.exports = {
  executeTargetMonitoring,
};
