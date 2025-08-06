#!/usr/bin/env node

/**
 * Simplified Test Script for Adobe App Builder
 * Essential testing functionality without over-engineered abstractions
 */

const http = require('http');
const https = require('https');
const path = require('path');

const chalk = require('chalk');
const dotenv = require('dotenv');
const ora = require('ora');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Formatting functions matching master branch style
const format = {
  success: (message) => chalk.green(`✔ ${message}`),
  error: (message) => chalk.red(`✖ ${message}`),
  url: (url) => `🔗 URL: ${chalk.blue(url)}`,
  environment: (env) => env.charAt(0).toUpperCase() + env.slice(1),
  status: (status, code) => {
    const color = code >= 200 && code < 300 ? 'green' : 'red';
    return chalk[color](`Status: ${status.toUpperCase()} (${code})`);
  },
  storage: (storageInfo) => `📦 Storage: ${storageInfo}`,
  muted: (message) => chalk.gray(message),
  downloadUrl: (url) => chalk.blue(url),
  downloadHeader: (header) => chalk.white(header),
  deploymentStart: (message) => `🚀 ${message}`,
  info: (message) => `📊 ${message}`,
};

// Spinner utilities matching master branch pattern
async function withSpinner(spinnerText, asyncFn) {
  const spinner = ora({
    text: format.muted(spinnerText),
    spinner: 'dots',
  }).start();

  try {
    const result = await asyncFn();
    spinner.stop();
    // Remove the "Request completed" message - if no error, it completed
    return result;
  } catch (error) {
    spinner.stop();
    console.log(format.error(`Failed: ${error.message}`));
    throw error;
  }
}

// Human-readable formatting utilities
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function parseArgs(args) {
  const parsed = { params: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        parsed[key] = value;
      } else {
        parsed[key] = true;
      }
    } else if (!parsed.action && !parsed.type) {
      parsed.action = arg;
    }
  }
  return parsed;
}

function buildActionUrl(actionName, params = {}, isProd = false) {
  const runtimeUrl =
    process.env.RUNTIME_URL || 'https://285361-188maroonwallaby-stage.adobeioruntime.net';
  const baseUrl = isProd ? runtimeUrl.replace('-stage', '-production') : runtimeUrl;

  const url = `${baseUrl}/api/v1/web/kukla-integration-service/${actionName}`;

  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
  }

  return url;
}

async function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parsed: null,
          };

          try {
            response.parsed = JSON.parse(data);
          } catch (e) {
            // Not JSON, keep as string
          }

          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Display test results matching master branch layout
function displayTestResults(response) {
  console.log();

  // Display storage info if available
  if (response.parsed && response.parsed.storage) {
    const storage = response.parsed.storage;
    const storageInfo = `${storage.provider} (${storage.location})`;
    console.log(format.storage(storageInfo));

    if (storage.properties && storage.properties.size) {
      console.log(format.muted(`   → Size: ${formatFileSize(storage.properties.size)}`));
    }

    if (storage.management && storage.management.expiresIn) {
      console.log(format.muted(`   → Expires: ${formatDuration(storage.management.expiresIn)}`));
    }
    console.log();
  }

  // Display status
  const isSuccess = response.statusCode < 400;
  console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.statusCode));

  // Display response content
  if (isSuccess && response.parsed) {
    if (response.parsed.message) {
      console.log(`Message: ${response.parsed.message}`);
    }

    // Display steps if available (matching master branch)
    if (response.parsed.steps && Array.isArray(response.parsed.steps)) {
      console.log();
      console.log(chalk.white('Steps:'));
      response.parsed.steps.forEach((step, index) => {
        console.log(chalk.green(`${index + 1}. ${step}`));
      });
    }

    if (response.parsed.downloadUrl) {
      console.log();
      console.log(format.downloadHeader('🔗 Download URL:'));
      console.log(`   ${format.downloadUrl(response.parsed.downloadUrl)}`);
    }

    // Display human-readable performance data
    if (response.parsed.performance) {
      console.log();
      console.log('📊 Performance:');
      displayPerformanceData(response.parsed.performance);
    }
  } else if (!isSuccess && response.parsed && response.parsed.error) {
    console.log(`Error: ${response.parsed.error}`);
  }
}

// Format execution time in human-readable format
function formatExecutionTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

// Display performance data in human-readable format
function displayPerformanceData(perf) {
  console.log(`   Method: ${perf.method || 'Unknown'}`);
  console.log(`   Products: ${perf.productCount || 0}`);

  console.log(`   API Calls: ${perf.apiCalls || 0}`);
  console.log(`   Data Sources Unified: ${perf.dataSourcesUnified || 0}`);

  // Show execution time for both methods
  if (perf.executionTime !== undefined) {
    console.log(`   Execution Time: ${formatExecutionTime(perf.executionTime)}`);
  }
}

async function testAction(actionName, params = {}, isProd = false) {
  const url = buildActionUrl(actionName, params, isProd);
  const environment = isProd ? 'production' : 'staging';

  // Display environment and action info first (matching master branch)
  console.log(format.success(`Environment detected: ${format.environment(environment)}`));
  console.log(format.success(`Action tested: ${actionName}`));
  console.log();

  // Show URL immediately
  console.log(format.url(url));

  // Execute test with spinner (matching master branch pattern)
  const response = await withSpinner('Making request...', async () => {
    return await makeRequest(url);
  });

  // Display results (matching master branch layout)
  displayTestResults(response);

  return {
    success: response.statusCode < 400,
    statusCode: response.statusCode,
    response: response.parsed || response.body,
  };
}

async function performanceTest(actionName, scenario = 'quick', isProd = false) {
  const scenarios = {
    quick: { requests: 5, concurrency: 1, description: 'Quick test - 5 requests' },
    load: { requests: 20, concurrency: 5, description: 'Load test - 20 requests, 5 concurrent' },
    stress: {
      requests: 50,
      concurrency: 10,
      description: 'Stress test - 50 requests, 10 concurrent',
    },
  };

  if (!scenarios[scenario]) {
    console.log(format.error(`Unknown scenario: ${scenario}`));
    console.log('Available scenarios:', Object.keys(scenarios).join(', '));
    return { success: false };
  }

  const config = scenarios[scenario];
  console.log(format.deploymentStart(`Performance test: ${actionName} (${scenario})`));
  console.log(format.info(`${config.description}`));
  console.log();

  const results = [];
  const startTime = Date.now();

  // Simple sequential execution for now (could be made concurrent)
  for (let i = 0; i < config.requests; i++) {
    console.log(format.muted(`Request ${i + 1}/${config.requests}...`));
    const result = await testAction(actionName, {}, isProd);
    results.push(result);

    if (!result.success) {
      console.log(format.error(`Request ${i + 1} failed: ${result.error}`));
    }
  }

  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;

  console.log();
  console.log(format.info('Performance Results:'));
  console.log(format.muted(`   → Total requests: ${results.length}`));
  console.log(format.muted(`   → Successful: ${chalk.green(successful)}`));
  console.log(format.muted(`   → Failed: ${chalk.red(failed)}`));
  console.log(format.muted(`   → Average response time: ${avgDuration.toFixed(2)}ms`));
  console.log(format.muted(`   → Total test time: ${formatDuration(totalTime)}`));
  console.log(
    format.muted(`   → Success rate: ${((successful / results.length) * 100).toFixed(1)}%`)
  );

  return {
    success: successful > 0,
    stats: {
      total: results.length,
      successful,
      failed,
      avgDuration,
      totalTime,
      successRate: (successful / results.length) * 100,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
Usage: npm run test:* [action-name] [options]

Examples:
  npm run test:action get-products
  npm run test:action get-products --use-case=adobeTarget
  npm run test:perf get-products --scenario=quick
  
Options:
  --help              Show this help message
  --action=ACTION     Action to test
  --type=TYPE         Test type (action, performance, suite)
  --scenario=NAME     Performance scenario (quick, load, stress)
  --use-case=CASE     Use case parameter
  --raw               Output raw JSON only
  --environment=ENV   Environment (production)

Available actions:
  get-products, get-products-mesh, browse-files, delete-file, download-file
    `);
    return;
  }

  const actionName = args.action || args._?.[0];
  const testType = args.type || 'action';
  const isProd = args.environment === 'production';

  if (!actionName && testType !== 'suite') {
    console.log('❌ Please specify an action name');
    console.log('Example: npm run test:action get-products');
    return;
  }

  try {
    let result;

    if (testType === 'performance') {
      result = await performanceTest(actionName, args.scenario || 'quick', isProd);
    } else if (testType === 'suite') {
      console.log('🧪 Running test suite...');
      const actions = ['get-products', 'get-products-mesh', 'browse-files'];
      const results = [];

      for (const action of actions) {
        console.log(`\n--- Testing ${action} ---`);
        const actionResult = await testAction(action, {}, isProd);
        results.push({ action, ...actionResult });
      }

      const successful = results.filter((r) => r.success).length;
      console.log(`\n📊 Suite Results: ${successful}/${results.length} actions passed`);

      result = { success: successful === results.length };
    } else {
      // Regular action test
      const params = {};
      if (args['use-case']) params.useCase = args['use-case'];

      result = await testAction(actionName, params, isProd);
    }

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
