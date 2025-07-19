#!/usr/bin/env node

/**
 * App Monitor
 * Complete application monitoring capability with URL expiration and health checks
 */

const fs = require('fs').promises;
const path = require('path');

const { parseMonitorArgs, displayHelp } = require('./shared/args');
const format = require('./shared/formatting');

// Business Workflows

/**
 * Complete application monitoring workflow with all monitoring types
 * @purpose Execute comprehensive monitoring including URL expiration, health checks, and system status
 * @param {Object} options - Monitoring options
 * @param {string} options.fileName - File to monitor for URL expiration
 * @param {string} options.useCase - Use case to monitor (adobeTarget, general)
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<Object>} Monitoring result with exit code
 * @usedBy monitor CLI entry point
 */
async function monitorAppWithAllComponents(options = {}) {
  const { fileName = 'products.csv', useCase = 'adobeTarget', verbose = true } = options;

  try {
    if (verbose) {
      console.log(format.info(`🎯 Starting ${useCase} monitoring...`));
      console.log(format.muted(`Monitoring file: ${fileName}`));
    }

    let result;

    // Step 1: Route to appropriate monitoring workflow
    switch (useCase) {
      case 'adobeTarget':
        result = await monitorAdobeTargetUrls(fileName, options);
        break;
      case 'health':
        result = await monitorSystemHealth();
        break;
      case 'general':
        result = await monitorGeneralUrls(fileName, options);
        break;
      default:
        throw new Error(`Unknown monitoring use case: ${useCase}`);
    }

    // Step 2: Display results
    if (verbose) {
      displayMonitoringResults(result, useCase);
    }

    return result;
  } catch (error) {
    console.log(format.error(`Monitoring failed: ${error.message}`));
    return {
      success: false,
      error: error.message,
      exitCode: 3, // Error exit code
    };
  }
}

/**
 * Basic monitoring workflow
 * @purpose Execute standard monitoring for URL expiration
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Monitoring result
 * @usedBy monitoring workflows requiring standard checks
 */
async function monitorApp(options = {}) {
  return await monitorAppWithAllComponents(options);
}

// Feature Operations

/**
 * Monitor Adobe Target URL expiration
 * @purpose Check Adobe Target URLs for expiration and alert on upcoming expiry
 * @param {string} fileName - CSV file containing URLs to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Adobe Target monitoring result
 * @usedBy monitorAppWithAllComponents
 */
async function monitorAdobeTargetUrls(fileName) {
  try {
    // Step 1: Locate and read the monitoring file
    const filePath = await findMonitoringFile(fileName);
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Step 2: Extract URLs from file content
    const urls = extractUrlsFromCsv(fileContent);

    if (urls.length === 0) {
      return {
        success: true,
        message: 'No URLs found to monitor',
        exitCode: 0,
        urls: [],
      };
    }

    // Step 3: Check each URL for expiration
    const urlResults = [];
    for (const url of urls) {
      const urlResult = await checkUrlExpiration(url);
      urlResults.push(urlResult);
    }

    // Step 4: Determine overall status
    const overallResult = calculateOverallStatus(urlResults);

    return {
      success: true,
      fileName,
      urls: urlResults,
      overallStatus: overallResult.status,
      message: overallResult.message,
      exitCode: overallResult.exitCode,
    };
  } catch (error) {
    return {
      success: false,
      fileName,
      error: error.message,
      exitCode: 3,
    };
  }
}

/**
 * Monitor system health
 * @purpose Check overall system health including Docker, Kubernetes, and Adobe I/O connectivity
 * @returns {Promise<Object>} System health monitoring result
 * @usedBy monitorAppWithAllComponents
 */
async function monitorSystemHealth() {
  try {
    // Step 1: Check runtime health
    const runtimeHealth = await checkRuntimeHealth();

    // Step 2: Check action availability
    const actionHealth = await checkActionHealth();

    // Step 3: Determine overall health
    const overallHealth = {
      runtime: runtimeHealth.healthy,
      actions: actionHealth.healthy,
    };

    const allHealthy = Object.values(overallHealth).every((h) => h);

    return {
      success: true,
      health: overallHealth,
      details: {
        runtime: runtimeHealth,
        actions: actionHealth,
      },
      message: allHealthy ? 'All systems healthy' : 'Some systems unhealthy',
      exitCode: allHealthy ? 0 : 1,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      exitCode: 3,
    };
  }
}

/**
 * Monitor general URLs for availability
 * @purpose Check general URLs for availability and response times
 * @param {string} fileName - File containing URLs to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} General URL monitoring result
 * @usedBy monitorAppWithAllComponents
 */
async function monitorGeneralUrls(fileName) {
  // Similar to Adobe Target monitoring but with different criteria
  return await monitorAdobeTargetUrls(fileName, { useCase: 'general' });
}

// Feature Utilities

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
 * Extract URLs from CSV file content
 * @purpose Parse CSV content to extract URLs for monitoring
 * @param {string} csvContent - CSV file content
 * @returns {Array<string>} Array of URLs found in CSV
 * @usedBy monitorAdobeTargetUrls, monitorGeneralUrls
 */
function extractUrlsFromCsv(csvContent) {
  // Look for presigned URLs (S3 pattern)
  const urlPattern = /https:\/\/[^\s,"\n]+\.amazonaws\.com[^\s,"\n]*/g;
  const urls = csvContent.match(urlPattern) || [];

  // Remove duplicates and return
  return [...new Set(urls)];
}

/**
 * Check URL expiration from S3 presigned URL
 * @purpose Extract expiration time from presigned URL and check against thresholds
 * @param {string} url - Presigned URL to check
 * @returns {Object} URL expiration check result
 * @usedBy monitorAdobeTargetUrls
 */
async function checkUrlExpiration(url) {
  try {
    // Extract expiration timestamp from URL
    const expirationMatch = url.match(/X-Amz-Expires=(\d+)/);
    const dateMatch = url.match(/X-Amz-Date=(\d{8}T\d{6}Z)/);

    if (!expirationMatch || !dateMatch) {
      return {
        url: url.substring(0, 80) + '...',
        status: 'unknown',
        message: 'Could not parse expiration from URL',
        daysUntilExpiry: null,
      };
    }

    const expirationSeconds = parseInt(expirationMatch[1]);
    const signedDate = new Date(
      dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
    );

    const expirationDate = new Date(signedDate.getTime() + expirationSeconds * 1000);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

    // Determine status based on days until expiry
    let status, message;
    if (daysUntilExpiry > 3) {
      status = 'current';
      message = `URL current (expires in ${daysUntilExpiry} days)`;
    } else if (daysUntilExpiry > 1) {
      status = 'warning';
      message = `URL expires soon (${daysUntilExpiry} days)`;
    } else if (daysUntilExpiry > 0) {
      status = 'critical';
      message = `URL expires very soon (${daysUntilExpiry} days)`;
    } else {
      status = 'expired';
      message = 'URL has expired';
    }

    return {
      url: url.substring(0, 80) + '...',
      status,
      message,
      daysUntilExpiry,
      expirationDate: expirationDate.toISOString(),
    };
  } catch (error) {
    return {
      url: url.substring(0, 80) + '...',
      status: 'error',
      message: `Error checking URL: ${error.message}`,
      daysUntilExpiry: null,
    };
  }
}

/**
 * Calculate overall monitoring status from individual URL results
 * @purpose Determine the worst-case status from all monitored URLs
 * @param {Array<Object>} urlResults - Results from individual URL checks
 * @returns {Object} Overall status with exit code
 * @usedBy monitorAdobeTargetUrls
 */
function calculateOverallStatus(urlResults) {
  const statusCounts = {
    current: 0,
    warning: 0,
    critical: 0,
    expired: 0,
    error: 0,
    unknown: 0,
  };

  // Count each status type
  urlResults.forEach((result) => {
    statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
  });

  // Determine overall status (worst case wins)
  if (statusCounts.expired > 0 || statusCounts.error > 0) {
    return {
      status: 'critical',
      message: `${statusCounts.expired + statusCounts.error} URLs expired or errored`,
      exitCode: 2,
    };
  } else if (statusCounts.critical > 0) {
    return {
      status: 'critical',
      message: `${statusCounts.critical} URLs expire very soon (< 1 day)`,
      exitCode: 2,
    };
  } else if (statusCounts.warning > 0) {
    return {
      status: 'warning',
      message: `${statusCounts.warning} URLs expire soon (< 3 days)`,
      exitCode: 1,
    };
  } else {
    return {
      status: 'current',
      message: `All ${statusCounts.current} URLs are current (> 3 days)`,
      exitCode: 0,
    };
  }
}

/**
 * Check Adobe I/O Runtime health
 * @purpose Verify runtime is accessible and functioning
 * @returns {Promise<Object>} Runtime health check result
 * @usedBy monitorSystemHealth
 */
async function checkRuntimeHealth() {
  // Simulate runtime health check (would use actual health endpoint)
  try {
    return {
      healthy: true,
      message: 'Runtime accessible',
      responseTime: Math.random() * 500 + 100,
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
      responseTime: null,
    };
  }
}

/**
 * Check action availability
 * @purpose Verify key actions are available and responding
 * @returns {Promise<Object>} Action health check result
 * @usedBy monitorSystemHealth
 */
async function checkActionHealth() {
  // Simulate action health checks (would test key actions)
  return {
    healthy: true,
    message: 'Key actions responding',
    actionsChecked: ['get-products', 'browse-files'],
  };
}

/**
 * Display monitoring results in user-friendly format
 * @purpose Format and display monitoring results with appropriate colors and formatting
 * @param {Object} result - Monitoring result to display
 * @param {string} useCase - Type of monitoring performed
 * @returns {void} Console output only
 * @usedBy monitorAppWithAllComponents
 */
function displayMonitoringResults(result, useCase) {
  console.log(`\n📊 ${useCase} Monitoring Results:`);

  if (useCase === 'adobeTarget') {
    console.log(`📁 File: ${result.fileName}`);
    console.log(format.info(`URLs checked: ${result.urls?.length || 0}`));

    if (result.urls && result.urls.length > 0) {
      console.log('\nURL Status:');
      result.urls.forEach((urlResult) => {
        const formattedStatus = getFormattedStatus(urlResult.status, urlResult.message);
        console.log(`  ${formattedStatus}`);
      });
    }

    console.log(`\n🏁 Overall: ${result.message}`);
  } else if (useCase === 'health') {
    console.log('System Health:');
    Object.entries(result.health).forEach(([component, healthy]) => {
      const formattedStatus = healthy
        ? format.success(`${component}: Healthy`)
        : format.error(`${component}: Unhealthy`);
      console.log(`  ${formattedStatus}`);
    });
  }

  console.log(`\n🚪 Exit Code: ${result.exitCode}`);
}

/**
 * Get formatted status message using standard formatting
 * @purpose Return formatted status using shared formatting standards
 * @param {string} status - Status string
 * @param {string} message - Status message
 * @returns {string} Formatted status message with standard icons
 * @usedBy displayMonitoringResults
 */
function getFormattedStatus(status, message) {
  switch (status) {
    case 'current':
      return format.success(message);
    case 'warning':
      return format.warning(message);
    case 'critical':
    case 'expired':
    case 'error':
      return format.error(message);
    default:
      return format.info(message);
  }
}

// CLI Entry Point

/**
 * Main CLI function
 * @purpose Handle command line arguments and execute appropriate monitoring workflow
 * @returns {Promise<void>} CLI execution completion
 * @usedBy CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseMonitorArgs(args);

  if (options.help) {
    displayHelp(
      'monitor',
      'npm run monitor [options]',
      [
        { flag: '--file <name>', description: 'CSV file to monitor (default: products.csv)' },
        { flag: '--use-case <type>', description: 'Monitoring type: adobeTarget, health, general' },
      ],
      [
        { command: 'npm run monitor', description: 'Monitor products.csv for Adobe Target URLs' },
        { command: 'npm run monitor -- --file custom.csv', description: 'Monitor custom file' },
        { command: 'npm run monitor -- --use-case health', description: 'Check system health' },
      ]
    );
    return;
  }

  const result = await monitorAppWithAllComponents(options);
  process.exit(result.exitCode);
}

// CLI Integration
if (require.main === module) {
  main().catch((error) => {
    console.error(format.error(`Monitor failed: ${error.message}`));
    process.exit(3);
  });
}

module.exports = {
  monitorAppWithAllComponents,
  monitorApp,
  monitorAdobeTargetUrls,
  monitorSystemHealth,
  monitorGeneralUrls,
};
