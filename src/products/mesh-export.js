/**
 * Products Mesh Export
 * Complete API Mesh product export capability with GraphQL integration
 */

const { buildEnrichedProductsQuery } = require('./mesh-export/graphql');
const { fetchEnrichedProductsFromMesh } = require('./mesh-export/mesh-requests');
const { validateMeshInput } = require('./mesh-export/validation');
const { enrichProductsWithInventory } = require('./product-enrichment');
const { extractProductMessage } = require('./shared/data-extraction');
const { exportCsvWithStorage } = require('../files/csv-export');
const { convertToCSV } = require('./rest-export/csv-generation');

// Business Workflows

/**
 * Export mesh products with storage
 * @purpose Complete mesh product export with storage
 * @param {Object} params - Export parameters with mesh configuration
 * @param {Object} config - Complete application configuration
 * @returns {Promise<Object>} Complete export result with storage info and steps
 * @throws {Error} When mesh export fails
 * @usedBy get-products-mesh action
 * @config mesh.endpoint, mesh.apiKey, commerce.credentials, storage.provider
 */
async function exportMeshProductsWithStorage(params, config) {
  const steps = [];

  try {
    // Step 1: Input validation (already done by action factory)
    steps.push('Successfully validated API Mesh credentials and URL');

    // Step 2-5: Execute DDD export workflow and collect results
    const exportResult = await exportMeshProducts(params, config);

    // Parse the CSV export response body to get download URLs
    const csvExportData = JSON.parse(exportResult.storageResult.body);

    // Add human-readable steps for the workflow
    steps.push(
      `Successfully fetched and enriched ${exportResult.productCount} products with category and inventory data`
    );
    steps.push(`Successfully transformed ${exportResult.productCount} products for export`);
    steps.push(`Successfully generated CSV file (${(exportResult.csvSize / 1024).toFixed(2)} KB)`);
    steps.push('Successfully stored CSV file');

    return {
      steps,
      productCount: exportResult.productCount,
      csvSize: exportResult.csvSize,
      storage: exportResult.storageResult.provider,
      fileName: csvExportData.fileName,
      downloadUrls: {
        action: csvExportData.downloadUrls?.action || csvExportData.actionDownloadUrl,
        presigned: csvExportData.downloadUrls?.presigned || csvExportData.presignedUrl,
        expiryHours: csvExportData.downloadUrls?.expiryHours || csvExportData.expiryHours || 24,
      },
      message: 'Product export completed successfully',
    };
  } catch (error) {
    steps.push(`Error occurred: ${error.message}`);
    throw error;
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
 * @usedBy exportMeshProductsWithStorage
 * @config mesh.endpoint, mesh.apiKey, commerce.credentials, products.fields
 */
async function exportMeshProducts(params, config, includeCSV = true) {
  // Step 1: Validate mesh configuration and parameters
  await validateMeshInput(params, config);

  // Step 2: Fetch enriched products from API Mesh
  const meshData = await fetchEnrichedProductsFromMesh(config, params, buildEnrichedProductsQuery);

  // Step 3: Enrich with real inventory data using working REST API calls
  const inventoryEnrichedProducts = await enrichProductsWithInventory(meshData, config, params);

  // Step 4: Sort products and transform for export format
  const sortedProducts = sortProductsBySku(inventoryEnrichedProducts);
  const builtProducts = await buildProducts(sortedProducts, config);

  // Step 5: Generate CSV if requested
  let csvResult = '';
  if (includeCSV) {
    csvResult = await convertToCSV(builtProducts, config);
  }

  // Step 6: Store CSV with configured storage provider
  const storageResult = await exportCsvWithStorage(csvResult, config, params);

  return {
    productCount: builtProducts.length,
    csvSize: csvResult.length,
    storageResult,
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

// Feature Utilities

/**
 * Transform image entry for export
 * @purpose Extract file path from media gallery entry for CSV export
 * @param {Object} imageEntry - Image entry from media_gallery_entries
 * @returns {string} Image file path or empty string
 * @usedBy buildProductObject for image field transformation
 */
function transformImageEntry(imageEntry) {
  if (!imageEntry || typeof imageEntry !== 'object') {
    return '';
  }
  return imageEntry.file || '';
}

module.exports = {
  // Business workflows
  exportMeshProductsWithStorage,
  exportMeshProducts,

  // Feature operations
  buildProducts,
  sortProductsBySku,

  // Feature utilities
  buildProductObject,
  transformImageEntry,
};
