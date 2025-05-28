/**
 * API Test Runner
 * @module tests/api/test-runner
 */

const { spawn } = require('child_process');

const axios = require('axios');

const testCases = require('./test-cases');
const { loadConfig } = require('../../config');
const { buildRuntimeUrl } = require('../../src/core/routing');
require('dotenv').config();

class APITestRunner {
  constructor(environment = 'dev') {
    this.config = loadConfig();
    this.environment = environment;
    this.baseUrl = this._getBaseUrl();
    this.devServerProcess = null;
  }

  _getBaseUrl() {
    switch (this.environment) {
      case 'dev':
        return `https://localhost:${this.config.api.local.port}`;
      case 'staging':
        return this.config.api.staging.baseUrl;
      case 'prod':
        return this.config.api.production.baseUrl;
      default:
        throw new Error(`Invalid environment: ${this.environment}`);
    }
  }

  async _validateEnvironment() {
    const requiredVars = ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'];
    const missing = requiredVars.filter((v) => !process.env[v]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  async _startDevServer() {
    if (this.environment !== 'dev') return;

    console.log('Starting development server...');

    this.devServerProcess = spawn('npm', ['run', 'dev:actions'], {
      stdio: 'inherit',
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(async () => {
        try {
          await axios.get(`${this.baseUrl}`, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
          });
          clearInterval(interval);
          console.log('Development server is ready');
          resolve();
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            this._stopDevServer();
            reject(new Error('Development server failed to start'));
          }
        }
      }, 1000);
    });
  }

  _stopDevServer() {
    if (this.devServerProcess) {
      console.log('Stopping development server...');
      this.devServerProcess.kill();
      this.devServerProcess = null;
    }
  }

  async runTests(endpoint, type = 'basic') {
    if (!testCases[endpoint]) {
      throw new Error(`No test cases found for endpoint: ${endpoint}`);
    }

    const tests = testCases[endpoint][type];
    if (!tests) {
      throw new Error(`No ${type} tests found for endpoint: ${endpoint}`);
    }

    console.log(`\nRunning ${type} tests for ${endpoint}...`);

    const results = {
      passed: 0,
      failed: 0,
      details: [],
    };

    for (const test of tests) {
      try {
        console.log(`\nTest: ${test.name}`);

        const url = buildRuntimeUrl(endpoint);
        const config = {
          method: test.method,
          url,
          headers: {
            ...test.headers,
            'Content-Type': 'application/json',
          },
          validateStatus: () => true, // Don't throw on error status codes
          httpsAgent:
            this.environment === 'dev'
              ? new (require('https').Agent)({ rejectUnauthorized: false })
              : undefined,
        };

        if (test.fields) {
          config.data = {
            fields: test.fields,
            commerce_url: process.env.COMMERCE_URL,
            commerce_admin_username: process.env.COMMERCE_ADMIN_USERNAME,
            commerce_admin_password: process.env.COMMERCE_ADMIN_PASSWORD,
          };
        }

        if (test.params) {
          config.params = test.params;
        }

        const response = await axios(config);

        // Validate status code
        const statusValid = response.status === test.expectedStatus;
        if (!statusValid) {
          throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
        }

        // Validate headers if specified
        if (test.validateHeaders) {
          const headersValid = test.validateHeaders(response.headers);
          if (!headersValid) {
            throw new Error('Header validation failed');
          }
        }

        // Validate response if specified
        if (test.validateResponse) {
          const responseValid = test.validateResponse(response.data);
          if (!responseValid) {
            throw new Error('Response validation failed');
          }
        }

        console.log('✓ Passed');
        results.passed++;
        results.details.push({
          name: test.name,
          status: 'passed',
        });
      } catch (error) {
        console.log(`✗ Failed: ${error.message}`);
        results.failed++;
        results.details.push({
          name: test.name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return results;
  }

  async runAllTests(endpoint) {
    try {
      await this._validateEnvironment();

      if (this.environment === 'dev') {
        await this._startDevServer();
      }

      const allResults = {
        endpoint,
        basic: await this.runTests(endpoint, 'basic'),
        errors: await this.runTests(endpoint, 'errors'),
        edge: await this.runTests(endpoint, 'edge'),
      };

      console.log('\nTest Summary:');
      console.log('=============');
      console.log(`Endpoint: ${endpoint}`);
      for (const type of ['basic', 'errors', 'edge']) {
        console.log(`\n${type.charAt(0).toUpperCase() + type.slice(1)} Tests:`);
        console.log(`Passed: ${allResults[type].passed}`);
        console.log(`Failed: ${allResults[type].failed}`);
      }

      return allResults;
    } finally {
      this._stopDevServer();
    }
  }
}

module.exports = APITestRunner;
