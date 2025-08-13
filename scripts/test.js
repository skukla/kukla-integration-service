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

const { format, parseArgs, withSpinner, buildActionUrl } = require('./utils/shared');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

// buildActionUrl is now imported from utils/shared

async function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    // Get IMS token from stored credentials
    let authHeaders = {};
    const { loadTokens } = require('./auth');
    const tokens = loadTokens();
    if (tokens && tokens.access_token) {
      authHeaders = { 'Authorization': `Bearer ${tokens.access_token}` };
    }
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
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

// Display storage information section
function displayStorageInfo(storage) {
  if (!storage) return;

  const storageInfo = `${storage.provider} (${storage.location})`;
  console.log(format.storage(storageInfo));

  if (storage.properties?.size) {
    console.log(format.muted(`   → Size: ${formatFileSize(storage.properties.size)}`));
  }
  if (storage.management?.expiresIn) {
    console.log(format.muted(`   → Expires: ${formatDuration(storage.management.expiresIn)}`));
  }
  console.log();
}

// Display progress steps based on API response data
function displayProgressSteps(data) {
  if (data.productCount === undefined) return;

  console.log();
  console.log(chalk.white('Progress:'));
  console.log(chalk.green('1. ✔ Validated input parameters'));
  console.log(
    chalk.green(`2. ✔ Fetched ${data.productCount} products via ${data.method || 'API'}`)
  );
  if (data.apiCalls) {
    console.log(chalk.green(`3. ✔ Made ${data.apiCalls} API calls`));
  }
  console.log(chalk.green('4. ✔ Generated CSV file'));
  if (data.provider) {
    console.log(chalk.green(`5. ✔ Stored file to ${data.provider}`));
  }
}

// Display performance metrics
function displayPerformanceInfo(data) {
  if (!data.productCount && !data.apiCalls) return;

  console.log();
  console.log('📊 Performance:');
  if (data.method) console.log(`   Method: ${data.method}`);
  if (data.productCount !== undefined) console.log(`   Products: ${data.productCount}`);
  if (data.apiCalls) console.log(`   API Calls: ${data.apiCalls}`);
  if (data.fileName) console.log(`   File: ${data.fileName}`);
}

// Main display function - simplified and focused
function displayTestResults(response) {
  console.log();

  displayStorageInfo(response.parsed?.storage);

  const isSuccess = response.statusCode < 400;
  console.log(format.status(isSuccess ? 'SUCCESS' : 'ERROR', response.statusCode));

  if (isSuccess && response.parsed) {
    if (response.parsed.message) {
      console.log(`Message: ${response.parsed.message}`);
    }

    displayProgressSteps(response.parsed);

    if (response.parsed.downloadUrl) {
      console.log();
      console.log(format.downloadHeader('🔗 Download URL:'));
      console.log(`   ${format.downloadUrl(response.parsed.downloadUrl)}`);
    }

    displayPerformanceInfo(response.parsed);
  } else if (!isSuccess && response.parsed?.error) {
    console.log(`Error: ${response.parsed.error}`);
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

  // Check for authentication unless help is requested
  if (!args.help) {
    const { checkStatus } = require('./auth');
    const hasToken = checkStatus();
    
    if (!hasToken) {
      console.log(format.error('IMS authentication required to run test scripts'));
      console.log('');
      console.log('Please authenticate first:');
      console.log(format.muted('  npm run auth:login'));
      console.log('');
      process.exit(1);
    }
  }

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
