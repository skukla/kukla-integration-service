/**
 * Main Catalog - Documentation for Direct Import Architecture
 *
 * This project uses direct imports for better architecture and maintainability.
 * All domains use direct imports - no index files with flat exports.
 *
 * ### Direct Import Examples:
 *
 * **Commerce Functions:**
 * const { executeAdminTokenCommerceRequest } = require('./commerce/operations/api-requests');
 * const { buildProductsEndpoint } = require('./commerce/utils/endpoint-builders');
 * const { getAuthToken } = require('./commerce/utils/admin-auth');
 *
 * **File Operations:**
 * const { storeCsvFile } = require('./files/workflows/file-management');
 * const { generateCsv } = require('./files/utils/csv');
 * const { initializeStorage } = require('./files/workflows/file-management');
 *
 * **Product Operations:**
 * const { fetchAndEnrichProducts } = require('./products/operations/enrichment');
 * const { buildProducts } = require('./products/operations/transformation');
 * const { createCsv } = require('./products/utils/csv');
 *
 * **HTMX Functions:**
 * const { generateFileBrowserUI } = require('./htmx/workflows/file-browser');
 * const { generateDeleteModal } = require('./htmx/workflows/file-browser');
 * const { generateErrorResponse } = require('./htmx/workflows/file-browser');
 *
 * **Testing Functions:**
 * const { apiTestingWorkflow } = require('./testing/workflows/api-testing');
 * const { performanceTestingWorkflow } = require('./testing/workflows/performance-testing');
 * const { testOrchestrationWorkflow } = require('./testing/workflows/test-orchestration');
 *
 * **Core Utilities:**
 * const { formatStepMessage } = require('./core/utils/operations/formatting');
 * const { checkMissingParams } = require('./core/validation/operations/parameters');
 * const { buildRuntimeUrl } = require('./core/routing/operations/runtime');
 *
 * **Actions use context injection (no imports needed):**
 * const { createAction } = require('./core/action');
 * // In action: const { products, files, core } = context;
 *
 * ### Benefits of Direct Imports:
 * - **Clarity**: Dependencies are immediately obvious
 * - **Maintainable**: No export lists to maintain
 * - **Discoverable**: Direct path to implementations
 * - **Consistent**: Same pattern throughout codebase
 * - **Zero confusion**: No index files to accidentally use
 */

// This file serves as documentation only.
// All functionality should be imported directly from specific modules.
