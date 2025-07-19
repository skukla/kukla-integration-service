/**
 * Monitor - Adobe Target Sub-module
 * Adobe Target URL monitoring, expiration checking, and health validation utilities
 */

const https = require('https');
const { URL } = require('url');

const { formatStepMessage } = require('../shared/formatting');

// Workflows

/**
 * Monitor Adobe Target URLs and health
 * @purpose Comprehensive monitoring of Adobe Target endpoint availability and health
 * @param {Array} urls - Array of URLs to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Complete Adobe Target monitoring result
 * @usedBy monitorAppWithAllComponents for Adobe Target health checking
 */
async function monitorAdobeTargetComprehensively(urls = [], options = {}) {
  const { verbose = true, timeout = 10000 } = options;

  const monitoringResult = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    urls: [],
    summary: {
      total: urls.length,
      healthy: 0,
      unhealthy: 0,
      timeouts: 0,
    },
    alerts: [],
    recommendations: [],
  };

  if (verbose) {
    console.log(
      formatStepMessage('adobe-target', 'info', `Monitoring ${urls.length} Adobe Target URLs`)
    );
  }

  // Monitor each URL
  for (const targetUrl of urls) {
    const urlResult = await monitorSingleAdobeTargetUrl(targetUrl, { timeout, verbose });
    monitoringResult.urls.push(urlResult);

    if (urlResult.status === 'healthy') {
      monitoringResult.summary.healthy++;
    } else {
      monitoringResult.summary.unhealthy++;
      if (urlResult.isTimeout) {
        monitoringResult.summary.timeouts++;
      }
      monitoringResult.alerts.push(`${targetUrl}: ${urlResult.message}`);
    }
  }

  // Determine overall health
  if (monitoringResult.summary.unhealthy > 0) {
    monitoringResult.overall = monitoringResult.summary.timeouts > 0 ? 'critical' : 'warning';
  }

  // Generate recommendations
  monitoringResult.recommendations = generateAdobeTargetRecommendations(monitoringResult);

  if (verbose) {
    displayAdobeTargetResults(monitoringResult);
  }

  return monitoringResult;
}

// Operations

/**
 * Monitor single Adobe Target URL
 * @purpose Check individual Adobe Target URL for availability and response time
 * @param {string} targetUrl - URL to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Single URL monitoring result
 * @usedBy monitorAdobeTargetComprehensively
 */
async function monitorSingleAdobeTargetUrl(targetUrl, options = {}) {
  const { timeout = 10000, verbose = false } = options;
  const startTime = Date.now();

  const result = {
    url: targetUrl,
    status: 'healthy',
    message: '',
    responseTime: 0,
    isTimeout: false,
    timestamp: new Date().toISOString(),
  };

  try {
    if (verbose) {
      console.log(formatStepMessage('url-check', 'info', `Checking ${targetUrl}`));
    }

    await checkUrlAvailability(targetUrl, timeout);

    result.responseTime = Date.now() - startTime;
    result.message = `Healthy (${result.responseTime}ms)`;

    if (result.responseTime > 5000) {
      result.status = 'warning';
      result.message = `Slow response (${result.responseTime}ms)`;
    }
  } catch (error) {
    result.status = 'unhealthy';
    result.responseTime = Date.now() - startTime;

    if (error.code === 'TIMEOUT' || result.responseTime >= timeout) {
      result.isTimeout = true;
      result.message = `Timeout after ${timeout}ms`;
    } else {
      result.message = error.message || 'Unknown error';
    }
  }

  return result;
}

/**
 * Check URL availability with timeout
 * @purpose Perform HTTP request to check URL availability
 * @param {string} targetUrl - URL to check
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<void>} Resolves if URL is available
 * @usedBy monitorSingleAdobeTargetUrl
 */
function checkUrlAvailability(targetUrl, timeout) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      pathname: parsedUrl.pathname,
      method: 'HEAD',
      timeout,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Utilities

/**
 * Generate Adobe Target monitoring recommendations
 * @purpose Provide actionable recommendations based on monitoring results
 * @param {Object} monitoringResult - Complete monitoring result
 * @returns {Array} Array of recommendation strings
 * @usedBy monitorAdobeTargetComprehensively
 */
function generateAdobeTargetRecommendations(monitoringResult) {
  const recommendations = [];

  if (monitoringResult.summary.timeouts > 0) {
    recommendations.push(
      'URGENT: URL timeouts detected - check network connectivity and Adobe Target service status'
    );
  }

  if (monitoringResult.summary.unhealthy > 0) {
    recommendations.push(
      'Some Adobe Target URLs are unhealthy - verify URL configuration and service availability'
    );
  }

  const slowUrls = monitoringResult.urls.filter(
    (u) => u.responseTime > 3000 && u.status !== 'unhealthy'
  );
  if (slowUrls.length > 0) {
    recommendations.push(
      `${slowUrls.length} URLs have slow response times - consider performance optimization`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('All Adobe Target URLs are healthy and responsive');
  }

  return recommendations;
}

/**
 * Display Adobe Target monitoring results
 * @purpose Show formatted Adobe Target monitoring results
 * @param {Object} result - Monitoring result to display
 * @usedBy monitorAdobeTargetComprehensively
 */
function displayAdobeTargetResults(result) {
  console.log(formatStepMessage('adobe-target', result.overall, 'Adobe Target Health Check'));

  console.log(`Overall Status: ${result.overall.toUpperCase()}`);
  console.log(`URLs Checked: ${result.summary.total}`);
  console.log(`Healthy: ${result.summary.healthy}, Unhealthy: ${result.summary.unhealthy}`);

  if (result.alerts.length > 0) {
    console.log('\nAlerts:');
    result.alerts.forEach((alert) => console.log(`  • ${alert}`));
  }

  if (result.recommendations.length > 0) {
    console.log('\nRecommendations:');
    result.recommendations.forEach((rec) => console.log(`  • ${rec}`));
  }

  console.log('\nURL Details:');
  result.urls.forEach((urlResult) => {
    const statusIcon =
      urlResult.status === 'healthy' ? '✅' : urlResult.status === 'warning' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${urlResult.url}: ${urlResult.message}`);
  });
}

module.exports = {
  // Workflows
  monitorAdobeTargetComprehensively,

  // Operations
  monitorSingleAdobeTargetUrl,
  checkUrlAvailability,

  // Utilities
  generateAdobeTargetRecommendations,
  displayAdobeTargetResults,
};
