#!/usr/bin/env node

/**
 * Monitor Script - Light DDD Entry Point
 * Main entry point for Adobe Target URL monitoring
 */

const { executeScriptWithExit } = require('./core/operations/script-framework');
const { executeTargetMonitoring } = require('./monitor/workflows/target-monitoring');

/**
 * Main function - Clean entry point
 * Handles Adobe Target URL expiration monitoring
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const options = {
    fileName: 'products.csv',
    useCase: 'adobeTarget',
    verbose: true,
  };

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Handle quiet flag
  if (args.includes('--quiet') || args.includes('-q')) {
    options.verbose = false;
  }

  // Handle custom file name
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    options.fileName = args[fileIndex + 1];
  }

  // Handle custom use case
  const useCaseIndex = args.indexOf('--use-case');
  if (useCaseIndex !== -1 && args[useCaseIndex + 1]) {
    options.useCase = args[useCaseIndex + 1];
  }

  // Execute monitoring workflow
  const result = await executeTargetMonitoring(options);

  // Exit with appropriate code for automation
  process.exit(result.exitCode);
}

/**
 * Show help information
 */
function showHelp() {
  console.log('🎯 Adobe Target URL Expiration Monitor');
  console.log('');
  console.log('Usage: npm run monitor:target [options]');
  console.log('       node scripts/monitor.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --file <filename>     File to monitor (default: products.csv)');
  console.log('  --use-case <case>     Use case to monitor (default: adobeTarget)');
  console.log('  --quiet, -q           Suppress detailed output');
  console.log('  --help, -h            Show this help message');
  console.log('');
  console.log('Exit Codes:');
  console.log('  0  URL is current (expires > 3 days)');
  console.log('  1  Warning - URL expires soon (< 2 days)');
  console.log('  2  Critical - URL expires very soon (< 1 day)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run monitor:target                    # Monitor default Adobe Target URL');
  console.log('  npm run monitor:target -- --quiet         # Monitor without detailed output');
  console.log('  npm run monitor:target -- --file my.csv   # Monitor custom file');
  console.log('');
  console.log('Weekly Process:');
  console.log('  1. Add to calendar: npm run monitor:target');
  console.log('  2. When alerted, run: npm run test:action get-products');
  console.log('  3. Copy presigned URL from output');
  console.log('  4. Update Adobe Target configuration');
  console.log('  5. Verify data feed is working');
}

if (require.main === module) {
  executeScriptWithExit('monitor', main);
}
