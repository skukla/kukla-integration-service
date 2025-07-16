/**
 * Architecture Audit Configuration
 *
 * Customizable settings for the architecture standards audit script
 * Allows teams to adjust rules, severity levels, and file patterns
 */

module.exports = {
  // === FILE DISCOVERY SETTINGS ===
  patterns: {
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
      'web-src/**', // Frontend has different standards
      '**/*.test.js',
      '**/*.spec.js',
      'coverage/**',
      '.git/**',
    ],
  },

  // === RULE CONFIGURATION ===
  rules: {
    // Tier 1: High Reliability Rules (CI/CD Gate)
    tier1: {
      enabled: true,
      failOnError: true, // Build fails if any Tier 1 rules fail
      rules: {
        'file-structure-compliance': {
          enabled: true,
          severity: 'error',
          options: {
            validDomains: ['products', 'files', 'commerce', 'htmx', 'shared'],
            validSharedSubdirs: ['action', 'errors', 'http', 'routing', 'validation', 'utils'],
            validScriptDomains: [
              'deployment',
              'testing',
              'monitoring',
              'development',
              'core',
              'shared',
            ],
          },
        },
        'import-organization': {
          enabled: true,
          severity: 'error',
          options: {
            requireSectionHeaders: true,
            allowedNamespaceImports: ['fs', 'path', 'glob', 'util', 'crypto'],
            enforceThreeTierPattern: true,
          },
        },
        'export-patterns': {
          enabled: true,
          severity: 'error',
          options: {
            requireSingleExportPoint: true,
            minExportsForOrganization: 3,
          },
        },
        'action-framework-compliance': {
          enabled: true,
          severity: 'error',
          options: {
            requireCreateAction: true,
            requireActionName: true,
            requireDescription: true,
            forbidDirectMainExport: true,
          },
        },
        'naming-conventions': {
          enabled: true,
          severity: 'error',
          options: {
            fileNaming: 'kebab-case',
            functionNaming: 'camelCase',
            constantNaming: 'UPPER_CASE',
          },
        },
        'jsdoc-documentation': {
          enabled: true,
          severity: 'error',
          options: {
            requireJSDoc: true,
            requireUsedByComments: true,
            minFunctionLengthForJSDoc: 5,
          },
        },
        'step-comments': {
          enabled: true,
          severity: 'error',
          options: {
            minAsyncCallsForSteps: 2,
            requireSequentialNumbering: true,
          },
        },
        'file-header-comments': {
          enabled: true,
          severity: 'warning', // Less strict for headers
          options: {
            minFileLengthForHeader: 50,
            requirePurposeDescription: true,
          },
        },
      },
    },

    // Tier 2: Pattern Detection Rules (Warnings)
    tier2: {
      enabled: true,
      failOnError: false, // Don't fail builds, but report issues
      rules: {
        'function-length-guidelines': {
          enabled: true,
          severity: 'warning',
          options: {
            targetMaxLines: 40,
            absoluteMaxLines: 60,
            excludePatterns: ['test', 'spec', 'mock'],
          },
        },
        'file-size-limits': {
          enabled: true,
          severity: 'warning',
          options: {
            targetMaxLines: 400,
            absoluteMaxLines: 600,
            recommendedMinLines: 150,
          },
        },
        'configuration-access-patterns': {
          enabled: true,
          severity: 'warning',
          options: {
            forbidOptionalChainingWithFallbacks: true,
            requireLoadConfigUsage: true,
            allowConfigBuilderExceptions: true,
          },
        },
        'feature-configuration-boundaries': {
          enabled: true,
          severity: 'warning',
          options: {
            requireConfigParameter: true,
            forbidConfigLoading: true,
            forbidConfigModification: true,
            requireConfigExtraction: true,
          },
        },
        'operation-configuration-usage': {
          enabled: true,
          severity: 'warning',
          options: {
            requireTargetedConfigSections: true,
            forbidGlobalConfigAccess: true,
            forbidEnvironmentDetection: true,
          },
        },
        'configuration-documentation': {
          enabled: true,
          severity: 'warning',
          options: {
            requireConfigRequirements: true,
            minConfigSections: 2,
          },
        },
        'error-handling-patterns': {
          enabled: true,
          severity: 'warning',
          options: {
            requireProperErrorCreation: true,
            requireErrorTypeImports: true,
            forbidConsoleOnlyErrorHandling: true,
          },
        },
        'feature-first-organization': {
          enabled: true,
          severity: 'warning',
          options: {
            requireOrganizationSections: true,
            minFunctionsForSections: 3,
            excludeSharedFiles: true,
          },
        },
      },
    },

    // Tier 3: Manual Review Rules (Guidance)
    tier3: {
      enabled: true,
      failOnError: false,
      rules: {
        'complex-business-logic': {
          enabled: true,
          severity: 'info',
          options: {
            maxNestedConditions: 3,
            maxCyclomaticComplexity: 8,
            complexityThresholds: {
              low: 3,
              medium: 6,
              high: 10,
            },
          },
        },
        'potential-cognitive-load': {
          enabled: true,
          severity: 'info',
          options: {
            maxImportCount: 10,
            detectMixedAbstractionLevels: true,
            flagHighCoupling: true,
          },
        },
        'cross-domain-dependencies': {
          enabled: true,
          severity: 'info',
          options: {
            allowedCrossDomainPatterns: [
              'shared', // Always allowed
              'commerce -> products', // Product enrichment
              'files -> products', // Product export
            ],
            flagCircularDependencies: true,
          },
        },
        'potential-abstraction-opportunities': {
          enabled: true,
          severity: 'info',
          options: {
            detectSimilarFunctionNames: true,
            similarNameThreshold: 2,
            detectRepeatedPatterns: true,
          },
        },
      },
    },
  },

  // === OUTPUT CONFIGURATION ===
  output: {
    format: 'console', // 'console' | 'json' | 'junit'
    verbosity: 'normal', // 'quiet' | 'normal' | 'verbose'
    colors: true,
    groupByRule: true,
    showFixSuggestions: true,

    // Report sections to include
    sections: {
      summary: true,
      tierBreakdown: true,
      detailedIssues: true,
      recommendations: true,
      fileStats: false, // Only in verbose mode
    },
  },

  // === CI/CD INTEGRATION ===
  ci: {
    // Exit codes for different scenarios
    exitCodes: {
      success: 0,
      tier1Failures: 1,
      tier2Failures: 0, // Don't fail CI for warnings
      tier3Failures: 0, // Don't fail CI for suggestions
      auditError: 2,
    },

    // Pre-commit hook behavior
    preCommit: {
      runTier1Only: true,
      allowSkipWithFlag: true, // Allow --no-verify to skip
      timeoutMs: 30000,
    },

    // Build integration
    build: {
      runFullAudit: true,
      cacheResults: true,
      parallelExecution: false,
    },
  },

  // === PERFORMANCE SETTINGS ===
  performance: {
    maxConcurrentFiles: 10,
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour in ms
    skipUnchangedFiles: true,
  },

  // === CUSTOM EXTENSIONS ===
  extensions: {
    customRules: [],
    plugins: [],

    // Custom rule configuration
    ruleTemplates: {
      // Template for creating custom rules
      customRule: {
        name: 'custom-rule-name',
        tier: 1, // 1, 2, or 3
        enabled: false,
        severity: 'warning',
        description: 'Custom rule description',
        implementation: null, // Function reference
      },
    },
  },
};
