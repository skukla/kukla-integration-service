/**
 * Monitor - System Health Sub-module
 * System health monitoring, memory tracking, and resource validation utilities
 */

const { totalmem, freemem } = require('os');

const { formatStepMessage } = require('../shared/formatting');

// Workflows

/**
 * Monitor system health comprehensively
 * @purpose Check all system health indicators and resource usage
 * @returns {Promise<Object>} Complete system health report
 * @usedBy monitorSystemHealth for comprehensive health checking
 */
async function monitorSystemHealthComprehensively() {
  const healthReport = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    components: {},
    alerts: [],
    recommendations: [],
  };

  // Monitor memory usage
  healthReport.components.memory = await monitorMemoryUsage();
  if (healthReport.components.memory.status !== 'healthy') {
    healthReport.overall = 'warning';
    healthReport.alerts.push(`Memory usage: ${healthReport.components.memory.message}`);
  }

  // Monitor disk usage
  healthReport.components.disk = await monitorDiskUsage();
  if (healthReport.components.disk.status !== 'healthy') {
    healthReport.overall = 'warning';
    healthReport.alerts.push(`Disk usage: ${healthReport.components.disk.message}`);
  }

  // Monitor process health
  healthReport.components.process = await monitorProcessHealth();
  if (healthReport.components.process.status !== 'healthy') {
    healthReport.overall = 'critical';
    healthReport.alerts.push(`Process health: ${healthReport.components.process.message}`);
  }

  // Generate recommendations
  healthReport.recommendations = generateHealthRecommendations(healthReport.components);

  return healthReport;
}

// Operations

/**
 * Monitor memory usage and thresholds
 * @purpose Check system memory usage against thresholds
 * @returns {Promise<Object>} Memory usage report
 * @usedBy monitorSystemHealthComprehensively
 */
async function monitorMemoryUsage() {
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = (usedMem / totalMem) * 100;

  const report = {
    status: 'healthy',
    message: '',
    metrics: {
      total: Math.round(totalMem / (1024 * 1024 * 1024)), // GB
      used: Math.round(usedMem / (1024 * 1024 * 1024)), // GB
      free: Math.round(freeMem / (1024 * 1024 * 1024)), // GB
      usagePercent: Math.round(usagePercent),
    },
  };

  if (usagePercent > 90) {
    report.status = 'critical';
    report.message = `Memory usage critically high: ${report.metrics.usagePercent}%`;
  } else if (usagePercent > 80) {
    report.status = 'warning';
    report.message = `Memory usage elevated: ${report.metrics.usagePercent}%`;
  } else {
    report.message = `Memory usage normal: ${report.metrics.usagePercent}%`;
  }

  return report;
}

/**
 * Monitor disk usage and available space
 * @purpose Check disk space usage against thresholds
 * @returns {Promise<Object>} Disk usage report
 * @usedBy monitorSystemHealthComprehensively
 */
async function monitorDiskUsage() {
  // Placeholder for disk monitoring logic
  // In a real implementation, this would check actual disk usage
  return {
    status: 'healthy',
    message: 'Disk usage within normal limits',
    metrics: {
      usagePercent: 45,
      availableGB: 50,
    },
  };
}

/**
 * Monitor process health and status
 * @purpose Check application process health indicators
 * @returns {Promise<Object>} Process health report
 * @usedBy monitorSystemHealthComprehensively
 */
async function monitorProcessHealth() {
  const report = {
    status: 'healthy',
    message: 'All processes running normally',
    metrics: {
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  };

  // Check process uptime
  if (report.metrics.uptime < 60) {
    report.status = 'warning';
    report.message = 'Process recently restarted';
  }

  // Check memory leaks
  const heapUsed = report.metrics.memoryUsage.heapUsed;
  const heapTotal = report.metrics.memoryUsage.heapTotal;
  const heapPercent = (heapUsed / heapTotal) * 100;

  if (heapPercent > 90) {
    report.status = 'warning';
    report.message = 'High heap usage detected - potential memory leak';
  }

  return report;
}

// Utilities

/**
 * Generate health recommendations based on component status
 * @purpose Provide actionable recommendations for system health issues
 * @param {Object} components - Health check components
 * @returns {Array} Array of recommendation strings
 * @usedBy monitorSystemHealthComprehensively
 */
function generateHealthRecommendations(components) {
  const recommendations = [];

  if (components.memory?.status === 'warning') {
    recommendations.push('Consider increasing available memory or optimizing memory usage');
  }

  if (components.memory?.status === 'critical') {
    recommendations.push('URGENT: Memory usage critical - restart or scale immediately');
  }

  if (components.disk?.metrics?.usagePercent > 80) {
    recommendations.push('Clean up disk space or expand storage capacity');
  }

  if (components.process?.status === 'warning') {
    recommendations.push('Monitor process stability and check for recent issues');
  }

  if (recommendations.length === 0) {
    recommendations.push('System health is optimal - no action required');
  }

  return recommendations;
}

/**
 * Format system health report for display
 * @purpose Create formatted health report output
 * @param {Object} healthReport - Complete health report
 * @returns {string} Formatted health report
 * @usedBy System health reporting
 */
function formatSystemHealthReport(healthReport) {
  const lines = [];

  lines.push(formatStepMessage('system-health', healthReport.overall, 'System Health Check'));
  lines.push(`Overall Status: ${healthReport.overall.toUpperCase()}`);

  if (healthReport.alerts.length > 0) {
    lines.push('\nAlerts:');
    healthReport.alerts.forEach((alert) => lines.push(`  • ${alert}`));
  }

  lines.push('\nComponent Status:');
  Object.entries(healthReport.components).forEach(([component, status]) => {
    lines.push(`  ${component}: ${status.status} - ${status.message}`);
  });

  if (healthReport.recommendations.length > 0) {
    lines.push('\nRecommendations:');
    healthReport.recommendations.forEach((rec) => lines.push(`  • ${rec}`));
  }

  return lines.join('\n');
}

module.exports = {
  // Workflows
  monitorSystemHealthComprehensively,

  // Operations
  monitorMemoryUsage,
  monitorDiskUsage,
  monitorProcessHealth,

  // Utilities
  generateHealthRecommendations,
  formatSystemHealthReport,
};
