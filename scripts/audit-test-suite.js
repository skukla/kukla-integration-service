#!/usr/bin/env node

/**
 * Audit Rule Test Suite
 * Comprehensive testing framework to prevent false positives in audit rules
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const fs = require('fs').promises;
const path = require('path');

// === DOMAIN DEPENDENCIES ===
const auditConfig = require('../audit.config.js');

/**
 * Test framework for audit rule validation
 * Ensures rules produce accurate results without false positives
 */
class AuditTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      details: [],
    };
    this.testCases = this.buildTestCases();
  }

  /**
   * Build comprehensive test cases for all audit rules
   * @returns {Object} Test cases organized by rule
   */
  buildTestCases() {
    return {
      'jsdoc-documentation': {
        validCases: [
          {
            name: 'Complete JSDoc with all required tags',
            code: `
/**
 * Export products to CSV with enrichment
 * @purpose Execute complete product export workflow with commerce integration
 * @param {Object} params - Action parameters with credentials
 * @param {Object} config - Configuration object with commerce settings
 * @returns {Promise<Object>} Export result with CSV and storage info
 * @throws {Error} When authentication or API calls fail
 * @usedBy get-products action, get-products-mesh action
 * @config commerce.baseUrl, commerce.api.timeout, products.fields
 */
async function exportProducts(params, config) {
  // Implementation
}`,
            shouldPass: true,
          },
          {
            name: 'Utility function with unused notation',
            code: `
/**
 * Generate product SKU from attributes
 * @purpose Create standardized SKU format for product identification
 * @param {string} category - Product category
 * @param {Object} attributes - Product attributes
 * @returns {string} Generated SKU
 * @usedBy Currently unused - available for future implementation
 */
function generateSku(category, attributes) {
  return category + '-' + Object.values(attributes).join('-');
}`,
            shouldPass: true,
          },
          {
            name: 'Nested async function (should be exempt)',
            code: `
async function processProducts(products) {
  const enriched = await Promise.all(
    products.map(async (product) => {
      // This nested async function should NOT require JSDoc
      const inventory = await fetchInventory(product.sku);
      return { ...product, inventory };
    })
  );
  return enriched;
}`,
            shouldPass: true,
          },
        ],
        invalidCases: [
          {
            name: 'Missing JSDoc entirely',
            code: `
function exportProducts(params, config) {
  // This should fail - no JSDoc
  const data = processProducts(params);
  const result = transformData(data);
  const output = formatOutput(result);
  const final = validateOutput(output);
  return final;
}`,
            shouldFail: true,
          },
          {
            name: 'JSDoc missing @purpose tag',
            code: `
/**
 * Export products to CSV
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} Result
 * @usedBy get-products action
 */
function exportProducts(params, config) {
  // Should fail - missing @purpose
  const data = processProducts(params);
  const result = transformData(data);
  const output = formatOutput(result);
  const final = validateOutput(output);
  return final;
}`,
            shouldFail: true,
          },
          {
            name: 'JSDoc missing @usedBy tag',
            code: `
/**
 * Export products to CSV
 * @purpose Execute product export workflow
 * @param {Object} params - Parameters
 * @returns {Promise<Object>} Result
 */
function exportProducts(params, config) {
  // Should fail - missing @usedBy
  const data = processProducts(params);
  const result = transformData(data);
  const output = formatOutput(result);
  const final = validateOutput(output);
  return final;
}`,
            shouldFail: true,
          },
        ],
      },

      'import-organization': {
        validCases: [
          {
            name: 'Proper three-tier import organization',
            code: `
// === INFRASTRUCTURE DEPENDENCIES ===
const fs = require('fs').promises;
const path = require('path');

// === CROSS-DOMAIN DEPENDENCIES ===
const { loadConfig } = require('../../config');
const { createError } = require('../shared/errors');

// === DOMAIN DEPENDENCIES ===
const { buildProducts } = require('./operations/transformation');

function processData() {
  // Implementation
}`,
            shouldPass: true,
          },
          {
            name: 'Valid namespace import for allowed modules',
            code: `
const fs = require('fs');
const path = require('path');

function utilityFunction() {
  return fs.readFileSync(path.join(__dirname, 'file.txt'));
}`,
            shouldPass: true,
          },
        ],
        invalidCases: [
          {
            name: 'Missing import organization sections',
            code: `
const fs = require('fs');
const { loadConfig } = require('../../config');
const { buildProducts } = require('./operations/transformation');

function processData() {
  // Should fail - no organization sections
}`,
            shouldFail: true,
          },
          {
            name: 'Inline require statements',
            code: `
function processData() {
  const fs = require('fs'); // Should fail - inline require
  return fs.readFileSync('file.txt');
}`,
            shouldFail: true,
          },
        ],
      },

      'action-framework-compliance': {
        validCases: [
          {
            name: 'Complete action with all architecture standards',
            code: `
/**
 * Product Export Action
 * Business capability: Export product data as CSV with multiple implementation options
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { exportProducts } = require('../../src/products/rest-export');

/**
 * Product export business logic
 * @purpose Execute complete product export workflow with REST API integration
 * @param {Object} context - Action context from createAction framework
 * @returns {Promise<Object>} Export result with CSV data and storage info
 * @usedBy Adobe App Builder frontend, external API consumers
 */
async function productExportBusinessLogic(context) {
  const { config, extractedParams, core } = context;
  
  // Step 1: Execute domain workflow
  const exportResult = await exportProducts(extractedParams, config);
  
  return {
    message: 'Product export completed successfully',
    steps: [core.formatStepMessage('product-export', 'success')],
    downloadUrl: exportResult.downloadUrl
  };
}

module.exports = createAction(productExportBusinessLogic, {
  actionName: 'get-products',
  description: 'Export products to CSV with enrichment',
});`,
            shouldPass: true,
          },
          {
            name: 'Action with mesh implementation variant naming',
            code: `
/**
 * Product Export Action (API Mesh)
 * Business capability: Export product data using API Mesh for enhanced performance
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { exportMeshProducts } = require('../../src/products/mesh-export');

async function meshExportBusinessLogic(context) {
  const result = await exportMeshProducts(context.extractedParams, context.config);
  return { message: 'Success', result };
}

module.exports = createAction(meshExportBusinessLogic, {
  actionName: 'get-products-mesh',
  description: 'Export products using API Mesh',
});`,
            shouldPass: true,
          },
        ],
        invalidCases: [
          {
            name: 'Legacy main export pattern',
            code: `
async function main(params) {
  // Should fail - using legacy main export
  return { statusCode: 200 };
}

module.exports = { main };`,
            shouldFail: true,
          },
          {
            name: 'Missing domain integration',
            code: `
const { createAction } = require('../../src/shared/action');

async function businessLogic(params) {
  // Should fail - no domain imports, business logic in action
  const data = await fetch('/api/products');
  return { success: true, data };
}

module.exports = createAction(businessLogic, {
  actionName: 'get-products',
  description: 'Get products',
});`,
            shouldFail: true,
          },
          {
            name: 'Technical naming instead of business capability',
            code: `
/**
 * REST API Fetch Handler Action
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { fetchData } = require('../../src/products/rest-export');

async function restApiFetchLogic(context) {
  return await fetchData(context.extractedParams, context.config);
}

module.exports = createAction(restApiFetchLogic, {
  actionName: 'rest-api-fetch',
  description: 'Fetch data via REST API',
});`,
            shouldFail: true,
          },
          {
            name: 'Missing business capability JSDoc',
            code: `
/**
 * Some action without business capability description
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { exportProducts } = require('../../src/products/rest-export');

async function businessLogic(context) {
  return await exportProducts(context.extractedParams, context.config);
}

module.exports = createAction(businessLogic, {
  actionName: 'get-products',
  description: 'Export products',
});`,
            shouldFail: true,
          },
          {
            name: 'Missing import organization sections',
            code: `
const { createAction } = require('../../src/shared/action/operations/action-factory');
const { exportProducts } = require('../../src/products/rest-export');

/**
 * Product Export Action
 * Business capability: Export product data as CSV
 */

async function businessLogic(context) {
  return await exportProducts(context.extractedParams, context.config);
}

module.exports = createAction(businessLogic, {
  actionName: 'get-products',
  description: 'Export products',
});`,
            shouldFail: true,
          },
          {
            name: 'Wrong domain mapping',
            code: `
/**
 * Product Export Action
 * Business capability: Export product data as CSV
 */

// === INFRASTRUCTURE DEPENDENCIES ===
const { createAction } = require('../../src/shared/action/operations/action-factory');

// === DOMAIN DEPENDENCIES ===
const { browseFiles } = require('../../src/files/file-browser');

async function businessLogic(context) {
  return await browseFiles(context.extractedParams, context.config);
}

module.exports = createAction(businessLogic, {
  actionName: 'get-products',
  description: 'Export products',
});`,
            shouldFail: true,
          },
        ],
      },

      'configuration-access-patterns': {
        validCases: [
          {
            name: 'Clean configuration access',
            code: `
const { loadConfig } = require('../../config');

async function processData(params) {
  const config = loadConfig(params);
  const timeout = config.commerce.api.timeout;
  const baseUrl = config.commerce.baseUrl;
  return await makeRequest(baseUrl, { timeout });
}`,
            shouldPass: true,
          },
        ],
        invalidCases: [
          {
            name: 'Optional chaining with fallbacks',
            code: `
async function processData(params) {
  const config = loadConfig(params);
  // Should fail - optional chaining with fallback
  const timeout = config.commerce?.api?.timeout || 30000;
  const baseUrl = config.commerce?.baseUrl || 'default-url';
  return await makeRequest(baseUrl, { timeout });
}`,
            shouldFail: true,
          },
        ],
      },

      'step-comments': {
        validCases: [
          {
            name: 'Workflow function with proper step comments',
            code: `
async function exportProductsWorkflow(params, config) {
  // Step 1: Validate input parameters
  await validateInput(params);
  
  // Step 2: Fetch products from Commerce API
  const products = await fetchProducts(config);
  
  // Step 3: Transform products to CSV format
  const csvData = await transformToCSV(products);
  
  // Step 4: Store CSV file
  const storageResult = await storeFile(csvData);
  
  return storageResult;
}`,
            shouldPass: true,
          },
          {
            name: 'Simple function without step comments (should pass)',
            code: `
async function validateInput(params) {
  // Only one async operation - no step comments needed
  const result = await checkParams(params);
  return result;
}`,
            shouldPass: true,
          },
        ],
        invalidCases: [
          {
            name: 'Multiple async calls without step comments',
            code: `
async function exportProductsWorkflow(params, config) {
  // Should fail - multiple async calls without step comments
  await validateInput(params);
  const products = await fetchProducts(config);
  const csvData = await transformToCSV(products);
  const storageResult = await storeFile(csvData);
  return storageResult;
}`,
            shouldFail: true,
          },
        ],
      },
    };
  }

  /**
   * Run all test cases and validate audit rule accuracy
   * @returns {Promise<Object>} Test results with pass/fail counts
   */
  async runAllTests() {
    console.log('🧪 Running Audit Rule Test Suite\n');

    for (const [ruleName, testCase] of Object.entries(this.testCases)) {
      console.log(`Testing rule: ${ruleName}`);
      await this.testRule(ruleName, testCase);
    }

    this.generateTestReport();
    return this.testResults;
  }

  /**
   * Test a specific audit rule with valid and invalid cases
   * @param {string} ruleName - Name of the rule to test
   * @param {Object} testCase - Test cases for the rule
   */
  async testRule(ruleName, testCase) {
    // Test valid cases (should pass)
    for (const validCase of testCase.validCases) {
      const result = await this.runTestCase(ruleName, validCase);
      if (result.passed === validCase.shouldPass) {
        this.testResults.passed++;
        console.log(`  ✅ ${validCase.name}`);
      } else {
        this.testResults.failed++;
        this.testResults.details.push({
          rule: ruleName,
          testCase: validCase.name,
          expected: 'pass',
          actual: 'fail',
          issue: 'False positive detected',
        });
        console.log(`  ❌ ${validCase.name} (FALSE POSITIVE)`);
      }
    }

    // Test invalid cases (should fail)
    for (const invalidCase of testCase.invalidCases) {
      const result = await this.runTestCase(ruleName, invalidCase);
      if (result.passed !== invalidCase.shouldFail) {
        this.testResults.passed++;
        console.log(`  ✅ ${invalidCase.name}`);
      } else {
        this.testResults.failed++;
        this.testResults.details.push({
          rule: ruleName,
          testCase: invalidCase.name,
          expected: 'fail',
          actual: 'pass',
          issue: 'False negative detected',
        });
        console.log(`  ❌ ${invalidCase.name} (FALSE NEGATIVE)`);
      }
    }
  }

  /**
   * Run a single test case against an audit rule
   * @param {string} ruleName - Name of the audit rule
   * @param {Object} testCase - Test case with code and expectations
   * @returns {Promise<Object>} Test result
   */
  async runTestCase(ruleName, testCase) {
    try {
      // Create appropriate test file path based on rule type
      let testFilePath;
      if (ruleName === 'action-framework-compliance') {
        // Action framework tests need to be in actions/*/index.js pattern
        const timestamp = Date.now();
        testFilePath = path.join(__dirname, `../actions/temp-test-${timestamp}/index.js`);
        await fs.mkdir(path.dirname(testFilePath), { recursive: true });
      } else {
        // Other tests can use regular temp files
        testFilePath = path.join(__dirname, `temp-test-${Date.now()}.js`);
      }

      await fs.writeFile(testFilePath, testCase.code);

      // Get the audit function for this rule
      const auditFunction = this.getAuditFunction(ruleName);

      if (!auditFunction) {
        throw new Error(`Audit function not found for rule: ${ruleName}`);
      }

      // Run the audit rule
      const result = await auditFunction(testFilePath);

      // Clean up
      await fs.unlink(testFilePath);
      if (ruleName === 'action-framework-compliance') {
        // Remove the directory too
        await fs.rmdir(path.dirname(testFilePath));
      }

      return result;
    } catch (error) {
      console.error(`Test execution error for ${testCase.name}:`, error.message);
      return { passed: false, issues: [`Test execution error: ${error.message}`] };
    }
  }

  /**
   * Get the audit function for a specific rule
   * @param {string} ruleName - Name of the audit rule
   * @returns {Function} Audit function
   */
  getAuditFunction(ruleName) {
    const auditModule = require('./audit.js');
    const functionMap = {
      'jsdoc-documentation': auditModule.auditJSDocDocumentation,
      'import-organization': auditModule.auditImportOrganization,
      'action-framework-compliance': auditModule.auditActionFramework,
      'configuration-access-patterns': auditModule.auditConfigurationPatterns,
      'step-comments': auditModule.auditStepComments,
      'file-structure-compliance': auditModule.auditFileStructure,
      'export-patterns': auditModule.auditExportPatterns,
      'naming-conventions': auditModule.auditNamingConventions,
    };

    const auditFunction = functionMap[ruleName];
    if (!auditFunction) {
      throw new Error(
        `Audit function not found for rule: ${ruleName}. Available functions: ${Object.keys(functionMap).join(', ')}`
      );
    }

    return auditFunction;
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 AUDIT RULE TEST REPORT');
    console.log('='.repeat(80));

    const total = this.testResults.passed + this.testResults.failed;
    const accuracy = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;

    console.log('\n📊 Summary:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${this.testResults.passed}`);
    console.log(`   Failed: ${this.testResults.failed}`);
    console.log(`   Accuracy: ${accuracy}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details.forEach((detail) => {
        console.log(`   • ${detail.rule}: ${detail.testCase}`);
        console.log(`     Expected: ${detail.expected}, Actual: ${detail.actual}`);
        console.log(`     Issue: ${detail.issue}`);
      });
    }

    if (accuracy < 95) {
      console.log(
        '\n⚠️  Warning: Test accuracy below 95%. Review audit rules for false positives.'
      );
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed! Audit rules are reliable.');
    }
  }
}

/**
 * Confidence scoring system for audit rules
 * Calculates confidence based on rule type and context
 */
class ConfidenceScorer {
  static calculateConfidence(ruleName, context) {
    const baseConfidence = auditConfig.rules.tier1.rules[ruleName]?.confidence || 0.5;

    // Adjust confidence based on context
    let adjustment = 0;

    // File type adjustments
    if (context.isGeneratedFile) adjustment -= 0.1;
    if (context.isTestFile) adjustment -= 0.05;
    if (context.isConfigFile) adjustment -= 0.1;

    // Rule-specific adjustments
    switch (ruleName) {
      case 'jsdoc-documentation':
        if (context.functionLength < 5) adjustment -= 0.2;
        if (context.isUtilityFunction) adjustment -= 0.1;
        break;

      case 'import-organization':
        if (context.fileLength < 20) adjustment -= 0.15;
        break;

      case 'step-comments':
        if (context.asyncCallCount < 3) adjustment -= 0.1;
        break;
    }

    return Math.max(0, Math.min(1, baseConfidence + adjustment));
  }
}

// === CLI INTEGRATION ===
if (require.main === module) {
  const testSuite = new AuditTestSuite();
  testSuite
    .runAllTests()
    .then((results) => {
      return process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test suite execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  AuditTestSuite,
  ConfidenceScorer,
};
