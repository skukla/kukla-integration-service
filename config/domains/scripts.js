/**
 * Scripts Domain Configuration
 * Configuration for all operational scripts (build, deploy, test, monitor)
 */

/**
 * Build scripts configuration
 * @param {Object} params - Configuration parameters
 * @param {boolean} isProd - Whether this is a production configuration
 * @returns {Object} Scripts configuration
 */
function buildScriptsConfig(params, isProd = false) {
  const environment = isProd ? 'production' : 'staging';

  return {
    environment,
    isProd,
    build: getBuildConfig(),
    deployment: getDeploymentConfig(),
    testing: getTestingConfig(),
    monitoring: getMonitoringConfig(),
    audit: getAuditConfig(),
    execution: getExecutionConfig(isProd),
    cli: getCliConfig(isProd),
  };
}

/**
 * Get build configuration
 */
function getBuildConfig() {
  return {
    outputDir: 'web-src/src/config/generated',
    meshTemplate: 'mesh-resolvers.template.js',
    meshOutput: 'mesh-resolvers.js',
    timeout: 30000,
  };
}

/**
 * Get deployment configuration
 */
function getDeploymentConfig() {
  return {
    commands: {
      staging: 'aio app deploy --no-publish',
      production: 'aio app deploy',
    },
    verification: { timeout: 30000, retries: 3 },
    confirmations: { production: true, staging: false },
  };
}

/**
 * Get testing configuration
 */
function getTestingConfig() {
  return {
    timeout: 10000,
    retries: 3,
    scenarios: {
      quick: { requests: 5, duration: 10 },
      baseline: { requests: 25, duration: 30 },
      load: { requests: 100, duration: 60 },
    },
    defaultScenario: 'quick',
    actions: ['get-products', 'get-products-mesh', 'browse-files', 'download-file', 'delete-file'],
  };
}

/**
 * Get monitoring configuration
 */
function getMonitoringConfig() {
  return {
    defaultFile: 'products.csv',
    useCases: ['adobeTarget', 'health', 'general'],
    thresholds: { warning: 3, critical: 1 },
    searchPaths: ['.', 'downloads', '~/Downloads'],
    checkInterval: 24 * 60 * 60 * 1000,
  };
}

/**
 * Get execution configuration
 */
function getExecutionConfig(isProd) {
  return {
    defaultTimeout: 300000,
    maxRetries: 3,
    logLevel: isProd ? 'error' : 'info',
    verboseOutput: !isProd,
  };
}

/**
 * Get CLI configuration
 */
function getCliConfig(isProd) {
  return {
    colors: !isProd,
    animations: !isProd,
    confirmations: isProd,
    helpExamples: true,
  };
}

/**
 * Validate scripts configuration
 * @param {Object} config - Scripts configuration to validate
 * @throws {Error} If required configuration is missing
 */
function validateScriptsConfig(config) {
  const required = [
    'environment',
    'build.outputDir',
    'deployment.commands',
    'testing.timeout',
    'monitoring.defaultFile',
  ];

  for (const path of required) {
    const value = getNestedValue(config, path);
    if (value === undefined || value === null) {
      throw new Error(`Scripts configuration missing required field: ${path}`);
    }
  }
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to access
 * @param {string} path - Dot notation path
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get audit validation configuration
 */
function getAuditValidationConfig() {
  return {
    enabled: true,
    testMode: process.env.AUDIT_TEST_MODE === 'true',
    strictMode: process.env.AUDIT_STRICT_MODE === 'true',
    exemptions: {
      files: [
        'scripts/audit.js',
        'mesh-resolvers.template.js',
        'mesh-resolvers.js',
        '**/*.test.js',
        '**/*.spec.js',
      ],
      rules: {
        'jsdoc-documentation': {
          exemptFunctionPatterns: [/^require\w+$/, /^_\w+$/, /^test\w+$/],
        },
      },
    },
    confidence: {
      minimumConfidence: 0.8,
      highConfidenceThreshold: 0.95,
      requireManualReview: 0.7,
    },
  };
}

/**
 * Get audit file patterns configuration
 */
function getAuditPatternsConfig() {
  return {
    include: [
      'src/**/*.js',
      'actions/**/*.js',
      'scripts/**/*.js',
      'config/**/*.js',
      'tools/**/*.js',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.parcel-cache/**',
      'web-src/**',
      '**/*.test.js',
      '**/*.spec.js',
      'coverage/**',
      '.git/**',
    ],
  };
}

/**
 * Get audit rules configuration
 */
function getAuditRulesConfig() {
  return {
    tier1: {
      enabled: true,
      failOnError: true,
      rules: {
        'file-structure-compliance': { enabled: true, severity: 'error', confidence: 0.98 },
        'import-organization': { enabled: true, severity: 'error', confidence: 0.95 },
        'export-patterns': { enabled: true, severity: 'error', confidence: 0.95 },
        'action-framework-compliance': { enabled: true, severity: 'error', confidence: 0.98 },
        'naming-conventions': { enabled: true, severity: 'error', confidence: 0.9 },
        'jsdoc-documentation': { enabled: true, severity: 'error', confidence: 0.85 },
      },
    },
    tier2: {
      enabled: true,
      failOnError: false,
      rules: {
        'function-length-guidelines': { enabled: true, severity: 'warning', confidence: 0.8 },
        'file-size-limits': { enabled: true, severity: 'warning', confidence: 0.85 },
        'configuration-access-patterns': { enabled: true, severity: 'warning', confidence: 0.9 },
        'feature-first-organization': { enabled: true, severity: 'warning', confidence: 0.75 },
      },
    },
    tier3: {
      enabled: true,
      failOnError: false,
      rules: {
        'cross-domain-dependencies': { enabled: true, severity: 'info', confidence: 0.7 },
        'abstraction-opportunities': { enabled: true, severity: 'info', confidence: 0.6 },
        'performance-considerations': { enabled: true, severity: 'info', confidence: 0.65 },
        'security-patterns': { enabled: true, severity: 'info', confidence: 0.7 },
      },
    },
  };
}

/**
 * Get audit configuration
 */
function getAuditConfig() {
  return {
    validation: getAuditValidationConfig(),
    patterns: getAuditPatternsConfig(),
    rules: getAuditRulesConfig(),
  };
}

module.exports = {
  buildScriptsConfig,
  validateScriptsConfig,
};
