#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ora = require('ora');
const kill = require('tree-kill');

const PID_FILE = path.join(__dirname, '..', '.pid');

async function cleanupProcesses() {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf-8');
    try {
      kill(parseInt(pid));
    } catch (e) {
      // Process may not exist anymore
    }
    fs.unlinkSync(PID_FILE);
  }
}

async function generateConfig() {
  const spinner = ora('Generating runtime configuration').start();
  try {
    require('./generate-runtime-config');
    spinner.succeed('Runtime configuration generated');
  } catch (error) {
    spinner.fail(`Failed to generate config: ${error.message}`);
    throw error;
  }
}

async function buildActions() {
  const spinner = ora('Building actions...').start();
  try {
    const { execSync } = require('child_process');
    execSync('aio app build', { stdio: 'pipe' });
    spinner.succeed('Actions built successfully');
  } catch (error) {
    spinner.fail(`Failed to build actions: ${error.message}`);
    throw error;
  }
}

async function startServer() {
  const spinner = ora('Starting development server...').start();

  return new Promise((resolve, reject) => {
    // Set higher log level for Adobe I/O CLI
    const env = {
      ...process.env,
      LOG_LEVEL: 'info',
      DEBUG: '', // Disable debug logging
    };

    const server = spawn('aio', ['app', 'dev', '-e', 'application'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    // Save PID for later cleanup
    fs.writeFileSync(PID_FILE, server.pid.toString());

    let output = '';
    let serverStarted = false;

    server.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      // Handle different phases of startup
      chunk.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Only show important messages
        if (
          line.includes('http') || // URLs
          line.includes('actions:') || // Action endpoints
          line.includes('Development server started') || // Server status
          line.includes('press CTRL+C') // Control instructions
        ) {
          // Remove timestamp prefixes and debug info
          const cleanLine = trimmedLine.replace(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s+\[[^\]]+\]\s+\w+:\s*/,
            ''
          );

          if (line.includes('http')) {
            spinner.succeed('Development server started');
            console.log('🔗', cleanLine);
          } else {
            console.log(cleanLine);
          }
        }
      });

      // Check for server ready
      if (chunk.includes('Local Dev Server Ready') && !serverStarted) {
        serverStarted = true;
        console.log('\n👉 Press Ctrl+C to stop the server\n');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const chunk = data.toString();
      // Only show actual errors, not debug info
      if (!chunk.includes('debug:')) {
        console.error(chunk);
      }
    });

    server.on('error', (error) => {
      spinner.fail();
      reject(new Error(`Failed to start server: ${error.message}`));
    });

    // Add timeout
    setTimeout(() => {
      if (!serverStarted) {
        spinner.fail();
        kill(server.pid);
        reject(new Error(`Timeout waiting for server\nServer logs:\n${output}`));
      }
    }, 30000);
  });
}

async function main() {
  console.log('🚀 Starting API server in dev mode...\n');

  try {
    await cleanupProcesses();
    await generateConfig();
    await buildActions();
    const server = await startServer();

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down server...');
      kill(server.pid);
      process.exit(0);
    });
  } catch (error) {
    console.error(`\n❌ Error starting API server: ${error.message}`);
    process.exit(1);
  }
}

// Run directly if called from command line
if (require.main === module) {
  main();
}

module.exports = { main };
