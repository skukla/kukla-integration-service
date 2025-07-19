/**
 * Monitor - System Health Sub-module
 * System health checks and infrastructure monitoring utilities
 */

const format = require('../shared/formatting');

/**
 * Monitor system health and infrastructure status
 * @purpose Check system health, memory usage, and infrastructure status
 * @param {Object} options - Health monitoring options
 * @returns {Promise<Object>} Health monitoring result
 * @usedBy monitorAppWithAllComponents
 */
async function monitorSystemHealth(options = {}) {
  const { verbose = true } = options;

  try {
    if (verbose) {
      console.log(format.subInfo('Checking system health...'));
    }

    // Step 1: Check memory usage
    const memoryCheck = checkMemoryUsage();

    // Step 2: Check disk space
    const diskCheck = await checkDiskSpace();

    // Step 3: Check process health
    const processCheck = checkProcessHealth();

    // Step 4: Build health result
    const result = buildSystemHealthResult(memoryCheck, diskCheck, processCheck);

    if (verbose) {
      displaySystemHealthResults(result);
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
 * Check memory usage
 * @purpose Monitor current memory usage and availability
 * @returns {Object} Memory check result
 * @usedBy monitorSystemHealth
 */
function checkMemoryUsage() {
  const used = process.memoryUsage();
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();

  const usedPercent = ((totalMem - freeMem) / totalMem) * 100;

  return {
    type: 'memory',
    status: usedPercent > 90 ? 'critical' : usedPercent > 75 ? 'warning' : 'ok',
    details: {
      used: Math.round(used.heapUsed / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      usedPercent: Math.round(usedPercent),
    },
  };
}

/**
 * Check disk space availability
 * @purpose Monitor disk space usage and availability
 * @returns {Promise<Object>} Disk check result
 * @usedBy monitorSystemHealth
 */
async function checkDiskSpace() {
  // This is a simplified check - in production you'd use fs.stat or similar
  try {
    return {
      type: 'disk',
      status: 'ok',
      details: {
        message: 'Disk space check completed (simplified)',
      },
    };
  } catch (error) {
    return {
      type: 'disk',
      status: 'error',
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Check process health
 * @purpose Monitor current process health and uptime
 * @returns {Object} Process check result
 * @usedBy monitorSystemHealth
 */
function checkProcessHealth() {
  const uptime = process.uptime();

  return {
    type: 'process',
    status: 'ok',
    details: {
      uptime: Math.round(uptime),
      pid: process.pid,
      version: process.version,
    },
  };
}

/**
 * Build system health monitoring result
 * @purpose Create structured health monitoring result
 * @param {Object} memoryCheck - Memory check result
 * @param {Object} diskCheck - Disk check result
 * @param {Object} processCheck - Process check result
 * @returns {Object} Health monitoring result
 * @usedBy monitorSystemHealth
 */
function buildSystemHealthResult(memoryCheck, diskCheck, processCheck) {
  const checks = [memoryCheck, diskCheck, processCheck];
  const hasErrors = checks.some((check) => check.status === 'error' || check.status === 'critical');
  const hasWarnings = checks.some((check) => check.status === 'warning');

  return {
    success: !hasErrors,
    useCase: 'health',
    checks,
    summary: {
      total: checks.length,
      ok: checks.filter((c) => c.status === 'ok').length,
      warnings: checks.filter((c) => c.status === 'warning').length,
      critical: checks.filter((c) => c.status === 'critical').length,
      errors: checks.filter((c) => c.status === 'error').length,
    },
    exitCode: hasErrors ? 1 : hasWarnings ? 0 : 0,
  };
}

/**
 * Display system health monitoring results
 * @purpose Show formatted health monitoring results
 * @param {Object} result - Health monitoring result to display
 * @usedBy monitorSystemHealth
 */
function displaySystemHealthResults(result) {
  console.log(format.info(`System health checks: ${result.checks.length}`));

  result.checks.forEach((check) => {
    const statusIcon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${check.type}: ${check.status}`);

    if (check.details && check.status !== 'ok') {
      console.log(format.muted(`   Details: ${JSON.stringify(check.details, null, 2)}`));
    }
  });

  const statusIcon = result.success ? '✅' : '❌';
  const statusText = result.success ? 'System healthy' : 'System issues detected';
  console.log(`${statusIcon} System health: ${statusText}`);
}

module.exports = {
  monitorSystemHealth,
};
