/**
 * Products Mesh Export
 * Complete API Mesh product export capability - Feature Core with Sub-modules
 */

const { buildEnrichedProductsQuery } = require('./mesh-export/graphql');
const {
  makeMeshRequestWithRetry,
  fetchEnrichedProductsFromMesh,
} = require('./mesh-export/mesh-requests');
const { validateMeshInput } = require('./mesh-export/validation');
const { extractProductMessage } = require('./shared/data-extraction');
const { transformImageEntry } = require('./utils/image');
const { exportCsvWithStorage } = require('../files/csv-export');

// Business Workflows

/**
 * Export mesh products with storage and fallback handling
 * @purpose Complete mesh product export with storage and error handling fallback
 * @param {Object} params - Export parameters with mesh configuration
 * @param {Object} config - Complete application configuration
 * @param {Object} core - Core utilities for step messaging
 * @returns {Promise<Object>} Complete export result with storage info and steps
 * @throws {Error} When mesh export fails
 * @usedBy get-products-mesh action
 * @config mesh.endpoint, mesh.apiKey, commerce.credentials, storage.provider
 */
async function exportMeshProductsWithStorageAndFallback(params, config, core) {
  const steps = [];

  try {
    // Step 1: Execute complete mesh product export workflow
    const exportResult = await exportMeshProducts(params, config);

    steps.push(
      core.formatStepMessage('fetch-mesh', 'success', { count: exportResult.productCount })
    );

    steps.push(
      core.formatStepMessage('build-products', 'success', { count: exportResult.productCount })
    );

    steps.push(core.formatStepMessage('create-csv', 'success', { size: exportResult.csvSize }));

    // Step 2: Handle storage with fallback
    const storageResult = await handleStorageWithFallback(
      exportResult,
      config,
      params,
      steps,
      core
    );

    return {
      success: true,
      exportResult,
      ...storageResult,
      steps,
    };
  } catch (error) {
    steps.push(
      core.formatStepMessage('mesh-export', 'error', {
        message: error.message,
      })
    );

    throw new Error(`Mesh export failed: ${error.message}`);
  }
}

/**
 * Complete mesh-based product export workflow with CSV generation
 * @purpose Execute complete product export workflow using API Mesh GraphQL integration
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Complete configuration object
 * @param {boolean} [includeCSV=true] - Whether to generate CSV data
 * @returns {Promise<Object>} Export result with mesh data, built products, and optionally CSV
 * @throws {Error} When API Mesh is unavailable or data is invalid
 * @usedBy exportMeshProductsWithStorageAndFallback
 * @config mesh.endpoint, mesh.apiKey, commerce.credentials, products.fields
 */
async function exportMeshProducts(params, config, includeCSV = true) {
  // Step 1: Validate mesh configuration and parameters
  await validateMeshInput(params, config);

  // Step 2: Fetch enriched products from API Mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, params, buildEnrichedProductsQuery);

  // Step 3: Sort products and transform for export format
  const sortedProducts = sortProductsBySku(meshData);
  const builtProducts = await buildProducts(sortedProducts, config);

  // Step 4: Generate CSV if requested
  let csvResult = '';
  if (includeCSV) {
    csvResult = await convertToCSV(builtProducts);
  }

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    csvContent: csvResult,
    products: builtProducts,
    meshData: meshData,
  };
}

// Feature Operations

/**
 * Sort products by SKU in ascending order
 * @purpose Ensure consistent product ordering for export
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of products sorted by SKU
 * @usedBy exportMeshProducts
 */
function sortProductsBySku(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.sort((a, b) => {
    const skuA = a.sku || '';
    const skuB = b.sku || '';
    return skuA.localeCompare(skuB);
  });
}

/**
 * Build products from mesh data
 * @purpose Transform mesh product data into standardized format for export
 * @param {Array} products - Array of product objects from mesh
 * @param {Object} config - Configuration object
 * @returns {Promise<Array>} Array of built product objects ready for CSV
 * @usedBy exportMeshProducts
 * @config main.exportFields
 */
async function buildProducts(products, config) {
  const categoryMap = {};

  // Build category map from mesh products (already enriched)
  products.forEach((product) => {
    if (product.categories) {
      product.categories.forEach((category) => {
        categoryMap[category.id] = category.name;
      });
    }
  });

  return products.map((product) => buildProductObject(product, categoryMap, config));
}

/**
 * Build standardized product object for mesh export
 * @purpose Create complete product object with all required fields for CSV export
 * @param {Object} product - Raw product data from API Mesh
 * @param {Object} categoryMap - Map of category data
 * @param {Object} config - Configuration object
 * @returns {Object} Standardized product object
 * @usedBy buildProducts
 */
function buildProductObject(product, categoryMap, config) {
  if (!product || typeof product !== 'object') {
    return {};
  }

  const productFields = config.main.exportFields;

  const fieldMappings = {
    sku: () => product.sku || '',
    name: () => product.name || '',
    price: () => parseFloat(product.price) || 0,
    qty: () => parseInt(product.qty, 10) || 0,
    categories: () => {
      if (product.categories && Array.isArray(product.categories)) {
        return product.categories.map((cat) => cat.name || cat);
      }
      return [];
    },
    images: () => (product.media_gallery_entries || []).map(transformImageEntry),
    type_id: () => product.type_id || '',
    status: () => product.status || 0,
    visibility: () => product.visibility || 1,
    weight: () => parseFloat(product.weight) || 0,
    created_at: () => product.created_at || '',
    updated_at: () => product.updated_at || '',
    is_in_stock: () => Boolean(product.is_in_stock),
    description: () => extractProductMessage(product, 'description') || '',
    short_description: () => extractProductMessage(product, 'short_description') || '',
  };

  // Build result with only requested fields
  const result = {};
  productFields.forEach((field) => {
    if (fieldMappings[field]) {
      result[field] = fieldMappings[field]();
    } else {
      result[field] = product[field] || '';
    }
  });

  return result;
}

/**
 * Convert products to CSV format for mesh export
 * @purpose Transform product array into CSV string with headers
 * @param {Array} products - Array of built product objects
 * @returns {Promise<string>} CSV formatted string with headers and data
 * @usedBy exportMeshProducts
 */
async function convertToCSV(products) {
  const headers = createCsvHeaders();
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add product rows
  products.forEach((product) => {
    const values = createCsvRow(product);
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Create CSV headers for mesh export
 * @purpose Define the column headers for CSV export
 * @returns {Array} Array of header strings
 * @usedBy convertToCSV
 */
function createCsvHeaders() {
  return [
    'sku',
    'name',
    'price',
    'qty',
    'is_in_stock',
    'categories',
    'images',
    'type_id',
    'status',
    'visibility',
    'weight',
    'created_at',
    'updated_at',
    'description',
    'short_description',
  ];
}

/**
 * Create CSV row from product data
 * @purpose Convert single product object to CSV row array
 * @param {Object} product - Built product object
 * @returns {Array} Array of values for CSV row
 * @usedBy convertToCSV
 */
function createCsvRow(product) {
  return [
    formatCsvField(product.sku),
    formatCsvField(product.name),
    formatCsvField(product.price, '0'),
    formatCsvField(product.qty, '0'),
    formatStockStatus(product.is_in_stock),
    formatArrayField(product.categories),
    formatArrayField(product.images),
    formatCsvField(product.type_id),
    formatCsvField(product.status, '0'),
    formatCsvField(product.visibility, '1'),
    formatCsvField(product.weight, '0'),
    formatCsvField(product.created_at),
    formatCsvField(product.updated_at),
    formatCsvField(product.description),
    formatCsvField(product.short_description),
  ];
}

/**
 * Format field value for CSV with quotes
 * @purpose Format individual field value for CSV output
 * @param {*} value - Field value to format
 * @param {string} defaultValue - Default value if field is empty
 * @returns {string} Formatted CSV field
 * @usedBy createCsvRow
 */
function formatCsvField(value, defaultValue = '') {
  return `"${value || defaultValue}"`;
}

/**
 * Format array field for CSV
 * @purpose Convert array to comma-separated string for CSV
 * @param {Array} arrayValue - Array value to format
 * @returns {string} Formatted CSV field
 * @usedBy createCsvRow
 */
function formatArrayField(arrayValue) {
  return `"${Array.isArray(arrayValue) ? arrayValue.join(', ') : ''}"`;
}

/**
 * Format stock status for CSV
 * @purpose Convert boolean stock status to Yes/No string
 * @param {boolean} isInStock - Stock status boolean
 * @returns {string} Formatted CSV field
 * @usedBy createCsvRow
 */
function formatStockStatus(isInStock) {
  return `"${isInStock ? 'Yes' : 'No'}"`;
}

/**
 * Handle storage with fallback logic
 * @purpose Store CSV file with comprehensive error handling and fallback options
 * @param {Object} exportResult - Export result containing CSV content
 * @param {Object} config - Application configuration
 * @param {Object} params - Export parameters
 * @param {Array} steps - Steps array to update
 * @param {Object} core - Core utilities for step messaging
 * @returns {Promise<Object>} Storage result with fallback indicator
 * @usedBy exportMeshProductsWithStorageAndFallback
 */
async function handleStorageWithFallback(exportResult, config, params, steps, core) {
  try {
    const storageResult = await exportCsvWithStorage(
      exportResult.csvContent,
      config,
      params,
      undefined,
      {
        useCase: params.useCase,
      }
    );

    steps.push(
      core.formatStepMessage('store-csv', 'success', {
        provider: storageResult.provider,
        fileName: storageResult.fileName,
      })
    );

    return {
      storageResult,
      fallback: false,
    };
  } catch (storageError) {
    steps.push(
      core.formatStepMessage('store-csv', 'warning', {
        message: `Storage failed: ${storageError.message}`,
      })
    );

    return {
      storageError,
      fallback: true,
    };
  }
}

module.exports = {
  // Business workflows
  exportMeshProductsWithStorageAndFallback,
  exportMeshProducts,

  // Feature operations
  makeMeshRequestWithRetry,
  buildProducts,

  // Feature utilities
  sortProductsBySku,
  buildProductObject,
  convertToCSV,
};
