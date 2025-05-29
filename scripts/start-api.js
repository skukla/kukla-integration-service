#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ora = require('ora').default;
const kill = require('tree-kill');

const PID_FILE = path.join(__dirname, '..', '.pid');

function execCommand(command) {
  return execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
}

async function cleanupProcesses() {
  const spinner = ora('Cleaning up existing processes').start();
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf-8');
      try {
        kill(parseInt(pid));
      } catch (e) {
        // Process may not exist anymore
      }
      fs.unlinkSync(PID_FILE);
    }
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to cleanup processes: ${error.message}`);
    throw error;
  }
}

async function cleanupArtifacts() {
  const spinner = ora('Cleaning up artifacts').start();
  try {
    execCommand('rm -rf .tmp dist');
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to cleanup artifacts: ${error.message}`);
    throw error;
  }
}

async function generateConfig() {
  const spinner = ora('Generating runtime configuration').start();
  try {
    execCommand('npm run predev');
    spinner.succeed();
  } catch (error) {
    spinner.fail(`Failed to generate config: ${error.message}`);
    throw error;
  }
}

async function startServer() {
  let buildSpinner = null;
  let serverSpinner = null;
  let currentPhase = 'init';

  return new Promise((resolve, reject) => {
    const server = spawn('aio', ['app', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
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

        // Handle build phase
        if (trimmedLine.includes('Building the app')) {
          if (currentPhase !== 'building') {
            currentPhase = 'building';
            buildSpinner = ora('Building the app...').start();
          }
        }
        // Handle server start phase
        else if (trimmedLine.includes('Starting development server')) {
          if (buildSpinner) {
            buildSpinner.succeed('Build completed');
            buildSpinner = null;
          }
          if (currentPhase !== 'starting') {
            currentPhase = 'starting';
            serverSpinner = ora('Starting development server...').start();
          }
        }
        // Handle URLs
        else if (line.includes('http')) {
          if (buildSpinner) {
            buildSpinner.succeed('Build completed');
            buildSpinner = null;
          }
          if (serverSpinner) {
            serverSpinner.succeed('Development server started');
            serverSpinner = null;
          }
          console.log('🔗', trimmedLine);
        }
        // Handle other output
        else if (!line.includes('watching') && !line.includes('bundling')) {
          console.log(trimmedLine);
        }
      });

      // Check for server ready
      if (chunk.includes('press CTRL+C to terminate') && !serverStarted) {
        serverStarted = true;
        if (serverSpinner) {
          serverSpinner.succeed('Development server started');
          serverSpinner = null;
        }
        console.log('\n👉 Press Ctrl+C to stop the server\n');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.error(chunk);
    });

    server.on('error', (error) => {
      if (buildSpinner) buildSpinner.fail();
      if (serverSpinner) serverSpinner.fail();
      reject(new Error(`Failed to start server: ${error.message}\nOutput: ${output}`));
    });

    // Add timeout
    setTimeout(() => {
      if (!serverStarted) {
        if (buildSpinner) buildSpinner.fail();
        if (serverSpinner) serverSpinner.fail();
        kill(server.pid);
        reject(new Error(`Timeout waiting for server\nServer logs:\n${output}`));
      }
    }, 30000);
  });
}

async function main() {
  console.log('🚀 Starting API server...\n');

  try {
    await cleanupProcesses();
    await cleanupArtifacts();
    await generateConfig();
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

main();
