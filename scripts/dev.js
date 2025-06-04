#!/usr/bin/env node

/**
 * Development script that handles both UI and API
 * Supports:
 * --ui-only: Start only the UI
 * --api-only: Start only the API
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ora = require('ora');
const kill = require('tree-kill');

// Parse arguments
const args = process.argv.slice(2);
const uiOnly = args.includes('--ui-only');
const apiOnly = args.includes('--api-only');

// Track child processes for cleanup
const children = new Set();
const PID_FILE = path.join(__dirname, '..', '.pid');

/**
 * Kill processes on specific ports
 * @param {number[]} ports - Array of ports to clear
 */
function killProcessesOnPorts(ports) {
  ports.forEach((port) => {
    try {
      const result = execSync(`lsof -ti:${port}`, { stdio: 'pipe', encoding: 'utf8' });
      const pids = result
        .trim()
        .split('\n')
        .filter((pid) => pid);

      pids.forEach((pid) => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        } catch (e) {
          // Process may already be dead
        }
      });
    } catch (e) {
      // No processes on this port
    }
  });
}

/**
 * Kill remaining development server processes
 */
function killDevelopmentProcesses() {
  try {
    // Kill any remaining vite, aio, or node dev processes
    const patterns = ['vite.*--port', 'aio.*app.*dev', 'node.*dev\\.js'];
    patterns.forEach((pattern) => {
      try {
        execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' });
      } catch (e) {
        // No matching processes
      }
    });
  } catch (e) {
    // No processes to kill
  }
}

/**
 * Clean up existing development environment
 */
async function cleanupExistingEnvironment() {
  const spinner = ora('Cleaning up existing development processes...').start();

  try {
    // Kill processes on ports we need
    const portsToClean = [3000, 9080, 35729];
    killProcessesOnPorts(portsToClean);

    // Kill any remaining development processes
    killDevelopmentProcesses();

    // Clean up PID file
    if (fs.existsSync(PID_FILE)) {
      try {
        fs.unlinkSync(PID_FILE);
      } catch (e) {
        // File may not exist
      }
    }

    // Wait a moment for processes to fully terminate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    spinner.succeed('Existing processes cleaned up');
  } catch (error) {
    spinner.fail('Failed to clean up existing processes');
    // Continue anyway, as this shouldn't be fatal
  }
}

function cleanup() {
  console.log('\n👋 Shutting down development environment...');
  children.forEach((child) => {
    try {
      kill(child.pid);
    } catch (e) {
      // Process may already be dead
    }
  });

  // Clean up PID file
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch (e) {
      // File may not exist
    }
  }

  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function validateEnvironment() {
  const spinner = ora('Validating development environment...').start();
  try {
    // Check if we have the required Adobe I/O Runtime credentials
    execSync('aio runtime property get', { stdio: 'pipe' });
    spinner.succeed('Environment validation passed');
  } catch (error) {
    spinner.fail('Environment validation failed');
    console.error('\n❌ Please ensure you are logged in with:');
    console.error('  aio auth login');
    console.error('And have selected a project with:');
    console.error('  aio app use\n');
    throw error;
  }
}

async function generateConfig() {
  const spinner = ora('Generating runtime configuration...').start();
  try {
    require('./generate-runtime-config');
    spinner.succeed('Runtime configuration generated');
  } catch (error) {
    spinner.fail('Failed to generate runtime configuration');
    throw error;
  }
}

async function buildActions() {
  const spinner = ora('Building actions...').start();
  try {
    execSync('aio app build', { stdio: 'pipe' });
    spinner.succeed('Actions built successfully');
  } catch (error) {
    spinner.fail('Failed to build actions');
    throw error;
  }
}

async function startUI() {
  if (apiOnly) return;

  const spinner = ora('Starting UI development server...').start();

  return new Promise((resolve, reject) => {
    const ui = spawn('vite', ['--port', '3000'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    children.add(ui);
    let serverStarted = false;

    ui.stdout.on('data', (data) => {
      const chunk = data.toString();
      if (chunk.includes('Local:') && !serverStarted) {
        serverStarted = true;
        spinner.succeed('UI development server started');

        // Extract and display URLs cleanly
        const lines = chunk.split('\n');
        lines.forEach((line) => {
          if (line.includes('Local:') || line.includes('Network:')) {
            const cleanLine = line.trim().replace(/^\s*➜\s*/, '');
            console.log(`🔗 ${cleanLine}`);
          }
        });
        resolve(ui);
      }
    });

    ui.stderr.on('data', (data) => {
      const chunk = data.toString();
      // Only show actual errors, not warnings
      if (chunk.includes('error') && !chunk.includes('Failed to resolve dependency')) {
        console.error(chunk);
      }
    });

    ui.on('error', (error) => {
      spinner.fail('Failed to start UI server');
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        spinner.fail('UI server startup timeout');
        reject(new Error('UI server failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

async function startAPI() {
  if (uiOnly) return;

  const spinner = ora('Starting API development server...').start();

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      LOG_LEVEL: 'info',
      DEBUG: '',
    };

    const api = spawn('aio', ['app', 'dev', '-e', 'application'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    children.add(api);
    fs.writeFileSync(PID_FILE, api.pid.toString());

    let serverStarted = false;
    let actionUrls = [];

    api.stdout.on('data', (data) => {
      const chunk = data.toString();

      chunk.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Clean up Adobe I/O CLI output
        const cleanLine = trimmedLine.replace(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s+\[[^\]]+\]\s+\w+:\s*/,
          ''
        );

        // Capture important information
        if (line.includes('https://localhost:9080') && !line.includes('custom-apps')) {
          if (line.includes('api/v1/web')) {
            actionUrls.push(cleanLine);
          } else if (!serverStarted) {
            serverStarted = true;
            spinner.succeed('API development server started');
            console.log(`🔗 ${cleanLine}`);
          }
        }

        if (line.includes('experience.adobe.com') && line.includes('localDevUrl')) {
          console.log(`🔗 Adobe Experience Platform: ${cleanLine}`);
        }
      });

      // Check for server ready
      if (chunk.includes('press CTRL+C')) {
        // Display action URLs
        if (actionUrls.length > 0) {
          console.log('\n📋 Available Actions:');
          actionUrls.forEach((url) => {
            const actionName = url.match(/\/([^/]+)$/)?.[1] || 'unknown';
            console.log(`   ✅ ${actionName}: ${url}`);
          });
        }
        resolve(api);
      }
    });

    api.stderr.on('data', (data) => {
      const chunk = data.toString();
      if (!chunk.includes('debug:') && !chunk.includes('warn:')) {
        console.error(chunk);
      }
    });

    api.on('error', (error) => {
      spinner.fail('Failed to start API server');
      reject(error);
    });

    // Timeout after 60 seconds for API server
    setTimeout(() => {
      if (!serverStarted) {
        spinner.fail('API server startup timeout');
        reject(new Error('API server failed to start within 60 seconds'));
      }
    }, 60000);
  });
}

async function main() {
  try {
    console.log('🚀 Starting development environment...\n');

    await cleanupExistingEnvironment();
    await validateEnvironment();
    await generateConfig();
    await buildActions();

    // Start servers based on arguments
    const promises = [];
    if (!apiOnly) {
      promises.push(startUI());
    }
    if (!uiOnly) {
      promises.push(startAPI());
    }

    await Promise.all(promises);

    console.log('\n✨ Development environment ready!\n');
    console.log('👉 Press Ctrl+C to stop all servers\n');

    // Keep the process alive
    return new Promise(() => {});
  } catch (error) {
    console.error('\n❌ Failed to start development environment:', error.message);
    cleanup();
  }
}

main();
