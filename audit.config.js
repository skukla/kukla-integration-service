/**
 * Architecture Audit Configuration
 *
 * Customizable settings for the architecture standards audit script
 * Allows teams to adjust rules, severity levels, and file patterns
 */

module.exports = {
  // === FALSE POSITIVE PREVENTION ===
  validation: {
    enabled: true,
    testMode: process.env.AUDIT_TEST_MODE === 'true',
    strictMode: process.env.AUDIT_STRICT_MODE === 'true',
    exemptions: {
      // Global exemption patterns
      files: [
        'scripts/audit.js', // Self-exemption for this file
        'mesh-resolvers.template.js', // Template files have different patterns
        'mesh-resolvers.js', // Generated files
        '**/*.test.js',
        '**/*.spec.js',
      ],
      // Rule-specific exemptions
      rules: {
        'jsdoc-documentation': {
          // Functions that don't need JSDoc
          exemptFunctionPatterns: [
            /^require\w+$/, // require functions
            /^_\w+$/, // private functions starting with _
            /^test\w+$/, // test functions
            /^mock\w+$/, // mock functions
          ],
          // Files with different JSDoc requirements
          exemptFiles: [
            'config/**/*.js', // Config files use different documentation
            'mesh-resolvers.js', // Generated file
          ],
        },
        'import-organization': {
          // Files that can use different import patterns
          exemptFiles: [
            'mesh-resolvers.js', // Can't use imports in mesh resolvers
            'mesh-resolvers.template.js',
          ],
        },
        'action-framework-compliance': {
          // Legacy actions being migrated
          exemptFiles: [
            // Add specific legacy actions here during migration
          ],
        },
      },
    },
    confidence: {
      // Confidence thresholds for different rule types
      minimumConfidence: 0.8, // Only report issues with 80%+ confidence
      highConfidenceThreshold: 0.95, // Mark as high confidence
      requireManualReview: 0.7, // Below this, require manual review
    },
  },

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
          confidence: 0.98, // Very high confidence - structural rules are clear
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
            exemptions: {
              // Allow legacy files during migration
              legacyFiles: [
                'src/index.js', // Legacy index file
              ],
            },
          },
        },
        'import-organization': {
          enabled: true,
          severity: 'error',
          confidence: 0.85, // High confidence - import patterns are clear
          options: {
            requireSectionComments: true,
            allowNamespaceImports: ['fs', 'path', 'glob', 'util'],
            exemptions: {
              // Files that can't use standard import organization
              specialFiles: ['mesh-resolvers.js', 'mesh-resolvers.template.js'],
            },
          },
        },
        'export-patterns': {
          enabled: true,
          severity: 'error',
          confidence: 0.9, // High confidence - export patterns are straightforward
          options: {
            requireOrganizationComments: true,
            minExportsForComments: 3,
          },
        },
        'action-framework-compliance': {
          enabled: true,
          severity: 'error',
          confidence: 0.95, // Very high confidence - action patterns are well-defined
          options: {
            requireCreateAction: true,
            requireActionName: true,
            requireDescription: true,
            allowLegacyDuringMigration: false,
          },
        },
        'naming-conventions': {
          enabled: true,
          severity: 'error',
          confidence: 0.92, // High confidence - naming is clear
          options: {
            enforceCamelCase: true,
            enforceKebabCase: true,
            allowAcronyms: ['API', 'URL', 'JSON', 'CSV', 'XML'],
          },
        },
        'jsdoc-documentation': {
          enabled: true,
          severity: 'error',
          confidence: 0.88, // Good confidence with exemption patterns
          options: {
            requireJSDoc: true,
            requireUsedByComments: true,
            minFunctionLengthForJSDoc: 5,
            requiredTags: ['purpose', 'usedBy'],
            optionalTags: ['config', 'throws'],
            usedByPatterns: {
              // Valid patterns for @usedBy tag
              activeUsage: /^[\w\-\s,./]+$/, // Function names, actions, file references
              unused:
                /^Currently unused - (available for future implementation|legacy function \(consider removal\)|public API for external consumption)$/,
            },
            exemptPatterns: [
              // Nested async functions like .map(async (item) => ...)
              /\.map\s*\(\s*async\s*\(/,
              /\.filter\s*\(\s*async\s*\(/,
              /\.forEach\s*\(\s*async\s*\(/,
              /\.reduce\s*\(\s*async\s*\(/,
              // Promise callbacks
              /\.then\s*\(\s*async?\s*\(/,
              /\.catch\s*\(\s*async?\s*\(/,
              // Internal helper functions within larger functions
              /function\s+\w+\s*\([^)]*\)\s*\{[^}]*function\s+/,
            ],
            contextualValidation: {
              enabled: true,
              // Additional validation based on function context
              validateUsedByAccuracy: true,
              validateConfigRequirements: true,
            },
          },
        },
        'step-comments': {
          enabled: true,
          severity: 'error',
          confidence: 0.9, // High confidence - step patterns are clear
          options: {
            minAsyncCallsForSteps: 2,
            requireSequentialNumbering: true,
            exemptions: {
              // Functions that don't need step comments
              utilityFunctions: /^(validate|check|format|transform)\w+$/,
            },
          },
        },
        'file-header-comments': {
          enabled: true,
          severity: 'warning', // Less strict for headers
          confidence: 0.75, // Lower confidence - header requirements are subjective
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
          confidence: 0.8, // Good confidence - function length is measurable
          options: {
            targetMaxLines: 40,
            absoluteMaxLines: 60,
            excludePatterns: ['test', 'spec', 'mock'],
            contextualAdjustment: {
              // Allow longer functions for specific types
              workflowFunctions: 80, // Workflows can be longer
              generatedFiles: 200, // Generated files can be much longer
            },
          },
        },
        'file-size-limits': {
          enabled: true,
          severity: 'warning',
          confidence: 0.95, // Very high confidence - file size is objective
          options: {
            targetMaxLines: 400,
            absoluteMaxLines: 600,
            exemptions: {
              // Files that can be larger
              specialPurpose: [
                'scripts/audit.js', // Audit script itself
                'mesh-resolvers.js', // Generated resolver file
              ],
            },
          },
        },
        'configuration-access-patterns': {
          enabled: true,
          severity: 'warning',
          confidence: 0.75, // Moderate confidence - context matters
          options: {
            forbidOptionalChaining: true,
            requireLoadConfig: true,
            exemptions: {
              // Files that can use different config patterns
              infrastructureFiles: ['config/**/*.js', 'src/shared/**/*.js'],
            },
          },
        },
        'feature-configuration-boundaries': {
          enabled: true,
          severity: 'warning',
          confidence: 0.7, // Moderate confidence - requires context understanding
          options: {
            forbidConfigLoading: true,
            requireConfigParameter: true,
          },
        },
        'operation-configuration-usage': {
          enabled: true,
          severity: 'warning',
          confidence: 0.72, // Moderate confidence
          options: {
            forbidEnvironmentDetection: true,
            limitConfigSections: 3,
          },
        },
        'configuration-documentation': {
          enabled: true,
          severity: 'warning',
          confidence: 0.68, // Lower confidence - documentation requirements vary
          options: {
            requireConfigDocumentation: true,
            minConfigSectionsForDocumentation: 2,
          },
        },
        'error-handling-patterns': {
          enabled: true,
          severity: 'warning',
          confidence: 0.77, // Good confidence - error patterns are clear
          options: {
            requireProperErrorHandling: true,
            forbidConsoleOnlyLogging: true,
          },
        },
        'feature-first-organization': {
          enabled: true,
          severity: 'warning',
          confidence: 0.65, // Lower confidence - organization is subjective
          options: {
            requireSectionComments: true,
            minFunctionsForSections: 3,
          },
        },
      },
    },

    // Tier 3: Manual Review Rules (Guidance Only)
    tier3: {
      enabled: true,
      failOnError: false,
      rules: {
        'complex-business-logic': {
          enabled: true,
          severity: 'info',
          confidence: 0.6, // Lower confidence - complexity is subjective
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
          confidence: 0.55, // Lower confidence - cognitive load is subjective
          options: {
            maxImportCount: 10,
            detectMixedAbstractionLevels: true,
            flagHighCoupling: true,
          },
        },
        'cross-domain-dependencies': {
          enabled: true,
          severity: 'info',
          confidence: 0.5, // Lowest confidence - dependencies need human review
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
          confidence: 0.45, // Very low confidence - abstraction is highly subjective
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
    format: 'detailed', // 'summary' | 'detailed' | 'json'
    showConfidenceScores: true,
    showManualReviewFlags: true,
    groupByRule: true,
    colorOutput: true,
    showExemptions: false, // Set to true for debugging exemptions
  },

  // === TESTING CONFIGURATION ===
  testing: {
    enabled: true,
    validateRuleAccuracy: true,
    testCases: {
      // Add test cases for each rule
      enabled: true,
      runBeforeAudit: false, // Set to true to validate rules before running
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
