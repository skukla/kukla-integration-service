/**
 * Scripts Domain Catalog - Documentation for Direct Import Architecture
 *
 * This scripts directory uses direct imports for better architecture and maintainability.
 * All scripts domains use direct imports - no index files with flat exports.
 *
 * ### Direct Import Examples:
 *
 * **Core Formatting:**
 * const format = require('./core/formatting');
 * const { createStepMessage } = require('./core/formatting');
 *
 * **Build Operations:**
 * const { loadMeshConfig } = require('./build/operations/mesh-config-processing');
 * const { generateFrontendConfig } = require('./build/operations/config-generation');
 *
 * **Deploy Operations:**
 * const { buildActionUrl } = require('./deploy/operations/url-building');
 * const { deployApp } = require('./deploy/operations/app-deployment');
 *
 * **Test Operations:**
 * const { executeAction } = require('./test/operations/test-execution');
 * const { displayTestResults } = require('./test/operations/response-handling');
 *
 * **Build Workflows:**
 * const { buildApp } = require('./build/workflows/app-build');
 * const { generateMeshConfig } = require('./build/workflows/mesh-generation');
 * const { generateFrontendConfig } = require('./build/workflows/frontend-generation');
 *
 * **Deploy Workflows:**
 * const { deployToStaging } = require('./deploy/workflows/app-deployment');
 * const { deployMesh } = require('./deploy/workflows/mesh-deployment');
 *
 * **Test Workflows:**
 * const { testAction } = require('./test/workflows/action-testing');
 * const { testApi } = require('./test/workflows/api-testing');
 * const { testPerformance } = require('./test/workflows/performance-testing');
 * const { orchestrateTests } = require('./test/workflows/test-orchestration');
 *
 * ### Benefits of Direct Imports:
 * - **Clarity**: Dependencies are immediately obvious
 * - **Maintainable**: No export lists to maintain
 * - **Discoverable**: Direct path to implementations
 * - **Consistent**: Same pattern as src/ directory
 * - **Zero confusion**: No index files to accidentally use
 */

// This file serves as documentation only.
// All functionality should be imported directly from specific modules.
