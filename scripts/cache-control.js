#!/usr/bin/env node

/**
 * CLI tool for cache override control
 * Usage: npm run cache:disable | cache:enable | cache:status
 */

const chalk = require('chalk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const { buildActionUrl } = require('./utils/shared');

async function controlCache(action) {
  // Build URL using shared utility with Adobe I/O Runtime environment variables
  const url = buildActionUrl('cache-control');

  try {
    console.log(chalk.blue(`Sending ${action} command to cache control...`));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    const result = await response.json();

    if (result.success) {
      // Always show success in green with checkmark for successful operations
      if (action === 'status') {
        // For status, color based on cache state
        console.log(
          result.cacheEnabled ? chalk.green(result.message) : chalk.yellow(result.message)
        );
      } else {
        // For enable/disable actions, always green checkmark for success
        console.log(chalk.green(result.message));
      }
    } else {
      console.log(chalk.red('Failed:', result.error || result.message));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:', error.message));
    console.error(chalk.yellow('Make sure the application is deployed to staging'));
    process.exit(1);
  }
}

// Parse command line argument
const action = process.argv[2] || 'status';
if (!['disable', 'enable', 'status'].includes(action)) {
  console.error(chalk.red('Invalid action. Use: disable, enable, or status'));
  console.log(chalk.gray('Examples:'));
  console.log(chalk.gray('  npm run cache:status   - Check current cache status'));
  console.log(chalk.gray('  npm run cache:disable  - Disable all caching'));
  console.log(chalk.gray('  npm run cache:enable   - Enable caching'));
  process.exit(1);
}

controlCache(action);
