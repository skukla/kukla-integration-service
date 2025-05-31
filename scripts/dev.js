#!/usr/bin/env node

/**
 * Development script that handles both UI and API
 * Supports:
 * --ui-only: Start only the UI
 * --api-only: Start only the API
 */

const { spawn } = require('child_process');

const ora = require('ora').default;
const kill = require('tree-kill');

// Parse arguments
const args = process.argv.slice(2);
const uiOnly = args.includes('--ui-only');
const apiOnly = args.includes('--api-only');

// Track child processes for cleanup
const children = new Set();

function cleanup() {
  console.log('\n👋 Shutting down...');
  children.forEach((child) => {
    try {
      kill(child.pid);
    } catch (e) {
      // Process may already be dead
    }
  });
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startUI() {
  const spinner = ora('Starting UI development server...').start();

  return new Promise((resolve, reject) => {
    // First generate runtime config
    require('./generate-runtime-config');

    const ui = spawn('vite', ['--port', '3000'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    children.add(ui);

    ui.stdout.on('data', (data) => {
      const chunk = data.toString();
      if (chunk.includes('Local:')) {
        spinner.succeed('UI development server started');
        console.log(chunk);
      }
    });

    ui.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    ui.on('error', (error) => {
      spinner.fail();
      reject(error);
    });

    resolve(ui);
  });
}

async function startAPI() {
  // We'll use our existing start-api.js
  const api = require('./start-api');
  return api.main();
}

async function main() {
  try {
    if (!apiOnly) {
      await startUI();
    }

    if (!uiOnly) {
      await startAPI();
    }

    console.log('\n🚀 Development environment ready!\n');
    console.log('👉 Press Ctrl+C to stop all servers\n');
  } catch (error) {
    console.error('❌ Failed to start development environment:', error);
    cleanup();
  }
}

main();
