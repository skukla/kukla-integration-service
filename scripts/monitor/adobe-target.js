/**
 * Monitor - Adobe Target Sub-module
 * Adobe Target URL expiration monitoring and validation utilities
 */

const fs = require('fs').promises;
const path = require('path');

const format = require('../shared/formatting');

/**
 * Monitor Adobe Target URLs for expiration
 * @purpose Check Adobe Target presigned URLs in CSV file for upcoming expiration
 * @param {string} fileName - Name of CSV file to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Monitoring result
 * @usedBy monitorAppWithAllComponents
 */
async function monitorAdobeTargetUrls(fileName, options = {}) {
  const { verbose = true } = options;

  try {
    // Step 1: Find monitoring file
    const filePath = await findMonitoringFile(fileName);

    // Step 2: Parse CSV and extract URLs
    const csvContent = await fs.readFile(filePath, 'utf8');
    const urls = extractUrlsFromCsv(csvContent);

    // Step 3: Check URL expiration
    const urlChecks = await checkUrlExpiration(urls, verbose);

    // Step 4: Generate monitoring result
    const result = buildAdobeTargetMonitoringResult(urlChecks, fileName);

    if (verbose) {
      displayAdobeTargetResults(result);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      exitCode: 2,
    };
  }
}

/**
 * Find monitoring file in common locations
 * @purpose Locate the monitoring file in project or download directories
 * @param {string} fileName - Name of file to find
 * @returns {Promise<string>} Full path to monitoring file
 * @usedBy monitorAdobeTargetUrls
 */
async function findMonitoringFile(fileName) {
  const possiblePaths = [
    fileName, // Current directory
    path.join(process.cwd(), fileName), // Project root
    path.join(process.cwd(), 'downloads', fileName), // Downloads folder
    path.join(require('os').homedir(), 'Downloads', fileName), // User downloads
  ];

  for (const filePath of possiblePaths) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      // File doesn't exist at this path, try next
    }
  }

  throw new Error(`Monitoring file not found: ${fileName}. Checked: ${possiblePaths.join(', ')}`);
}

/**
 * Extract URLs from CSV content
 * @purpose Parse CSV and extract thumbnail_url column values
 * @param {string} csvContent - Raw CSV file content
 * @returns {Array<string>} Array of URLs found in CSV
 * @usedBy monitorAdobeTargetUrls
 */
function extractUrlsFromCsv(csvContent) {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  // Find thumbnail_url column index
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const urlColumnIndex = headers.findIndex(
    (header) =>
      header.toLowerCase().includes('thumbnail_url') || header.toLowerCase().includes('url')
  );

  if (urlColumnIndex === -1) {
    throw new Error('No URL column found in CSV. Expected "thumbnail_url" or similar.');
  }

  // Extract URLs from data rows
  const urls = [];
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    if (columns[urlColumnIndex]) {
      const url = columns[urlColumnIndex].trim().replace(/"/g, '');
      if (url && url.startsWith('http')) {
        urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * Check URL expiration for Adobe Target URLs
 * @purpose Analyze presigned URLs for expiration timing
 * @param {Array<string>} urls - URLs to check
 * @param {boolean} verbose - Show detailed output
 * @returns {Promise<Array>} Array of URL check results
 * @usedBy monitorAdobeTargetUrls
 */
async function checkUrlExpiration(urls, verbose = true) {
  const urlChecks = [];
  const now = Date.now();

  for (const url of urls) {
    try {
      // Extract expiration from presigned URL
      const urlObj = new URL(url);
      const expires = urlObj.searchParams.get('Expires');

      if (expires) {
        const expirationTime = parseInt(expires) * 1000; // Convert to milliseconds
        const timeUntilExpiration = expirationTime - now;
        const daysUntilExpiration = timeUntilExpiration / (1000 * 60 * 60 * 24);

        const status =
          daysUntilExpiration < 1 ? 'expired' : daysUntilExpiration < 2 ? 'expiring_soon' : 'valid';

        urlChecks.push({
          url: url.substring(0, 80) + '...', // Truncate for display
          expires: new Date(expirationTime).toISOString(),
          daysUntilExpiration: Math.round(daysUntilExpiration * 10) / 10,
          status,
        });
      } else {
        urlChecks.push({
          url: url.substring(0, 80) + '...',
          expires: 'No expiration found',
          daysUntilExpiration: 0,
          status: 'unknown',
        });
      }
    } catch (error) {
      urlChecks.push({
        url: url.substring(0, 80) + '...',
        expires: 'Parse error',
        daysUntilExpiration: 0,
        status: 'error',
      });
    }
  }

  return urlChecks;
}

/**
 * Build Adobe Target monitoring result
 * @purpose Create structured monitoring result for Adobe Target URLs
 * @param {Array} urlChecks - URL check results
 * @param {string} fileName - Monitored file name
 * @returns {Object} Monitoring result object
 * @usedBy monitorAdobeTargetUrls
 */
function buildAdobeTargetMonitoringResult(urlChecks, fileName) {
  const expired = urlChecks.filter((check) => check.status === 'expired').length;
  const expiringSoon = urlChecks.filter((check) => check.status === 'expiring_soon').length;
  const valid = urlChecks.filter((check) => check.status === 'valid').length;
  const unknown = urlChecks.filter((check) => check.status === 'unknown').length;
  const errors = urlChecks.filter((check) => check.status === 'error').length;

  const success = expired === 0 && expiringSoon === 0 && errors === 0;

  return {
    success,
    useCase: 'adobeTarget',
    fileName,
    urls: urlChecks,
    summary: {
      total: urlChecks.length,
      expired,
      expiringSoon,
      valid,
      unknown,
      errors,
    },
    exitCode: success ? 0 : 1,
  };
}

/**
 * Display Adobe Target monitoring results
 * @purpose Show formatted monitoring results for Adobe Target URLs
 * @param {Object} result - Monitoring result to display
 * @usedBy monitorAdobeTargetUrls
 */
function displayAdobeTargetResults(result) {
  console.log(format.info(`URLs checked: ${result.urls ? result.urls.length : 0}`));

  if (result.summary) {
    console.log(
      format.info(
        `Valid: ${result.summary.valid}, Expiring soon: ${result.summary.expiringSoon}, Expired: ${result.summary.expired}`
      )
    );

    if (result.summary.expired > 0 || result.summary.expiringSoon > 0) {
      console.log(format.warn('⚠️  Some URLs need attention:'));

      result.urls.forEach((check) => {
        if (check.status === 'expired' || check.status === 'expiring_soon') {
          const statusIcon = check.status === 'expired' ? '🔴' : '🟡';
          console.log(`${statusIcon} ${check.url} - expires in ${check.daysUntilExpiration} days`);
        }
      });
    }
  }

  const statusIcon = result.success ? '✅' : '❌';
  const statusText = result.success ? 'All URLs valid' : 'URLs need attention';
  console.log(`${statusIcon} Adobe Target monitoring: ${statusText}`);
}

module.exports = {
  monitorAdobeTargetUrls,
};
