/**
 * Product Enrichment Workflows
 *
 * High-level orchestration functions for specialized product data enrichment workflows.
 * Coordinates complex enrichment processes combining multiple data sources.
 */

const {
  orchestrateInventoryRequests,
  orchestrateCategoryRequests,
} = require('../operations/api-requests');
const { retryWithAuthHandling } = require('../operations/authentication');
const {
  processProductBatch,
  enrichProductData,
  orchestrateDataProcessing,
} = require('../operations/data-processing');

/**
 * Executes a comprehensive product enrichment workflow
 * @param {Object} params - Enrichment parameters
 * @param {Array<Object>} params.products - Base product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @param {Object} [params.options] - Enrichment options
 * @returns {Promise<Object>} Enriched product data
 */
async function executeProductEnrichment(params) {
  const { products, config, actionParams, trace, options = {} } = params;

  try {
    // Step 1: Process base product data
    const processedProducts = processProductBatch(products, config, options);

    if (!processedProducts.products.length) {
      return {
        success: true,
        enrichedProducts: [],
        enrichmentStats: {
          totalProducts: 0,
          categoriesEnriched: 0,
          inventoryEnriched: 0,
          mediaEnriched: 0,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          workflow: 'product-enrichment',
        },
      };
    }

    // Step 2: Extract enrichment requirements
    const enrichmentNeeds = analyzeEnrichmentNeeds(processedProducts.products, options);

    // Step 3: Fetch additional data in parallel
    const additionalData = await fetchAdditionalData(enrichmentNeeds, config, actionParams, trace);

    // Step 4: Apply enrichment
    const enrichmentResult = enrichProductData(
      processedProducts.products,
      additionalData.categoryMap,
      additionalData.inventoryMap,
      options
    );

    return {
      success: true,
      enrichedProducts: enrichmentResult.enrichedProducts,
      enrichmentStats: enrichmentResult.enrichmentStats,
      validation: processedProducts.validation,
      metadata: {
        timestamp: new Date().toISOString(),
        workflow: 'product-enrichment',
        dataFetched: {
          categories: Object.keys(additionalData.categoryMap).length,
          inventory: Object.keys(additionalData.inventoryMap).length,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        workflow: 'product-enrichment',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Executes a category-focused enrichment workflow
 * @param {Object} params - Category enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Category-enriched product data
 */
async function executeCategoryEnrichment(params) {
  const { products, config, actionParams, trace } = params;

  try {
    // Extract category IDs from products
    const categoryIds = extractCategoryIds(products);

    if (!categoryIds.length) {
      return {
        success: true,
        enrichedProducts: products,
        categoryStats: {
          totalCategories: 0,
          productsEnriched: 0,
        },
      };
    }

    // Fetch category data
    const categoryResponses = await retryWithAuthHandling(
      () => orchestrateCategoryRequests(categoryIds, config, actionParams, trace),
      { maxRetries: 2 }
    );

    // Process category data
    const categoryData = orchestrateDataProcessing({ categories: categoryResponses }, config, {
      validate: false,
    });

    // Apply category enrichment
    const enrichmentResult = enrichProductData(
      products,
      categoryData.processing.categoryProcessing || {},
      {},
      { includeCategories: true, includeInventory: false }
    );

    return {
      success: true,
      enrichedProducts: enrichmentResult.enrichedProducts,
      categoryStats: {
        totalCategories: categoryIds.length,
        productsEnriched: enrichmentResult.enrichmentStats.categoriesEnriched,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        workflow: 'category-enrichment',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        workflow: 'category-enrichment',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Executes an inventory-focused enrichment workflow
 * @param {Object} params - Inventory enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @param {Object} params.actionParams - Action parameters
 * @param {Object} [params.trace] - Optional trace context
 * @returns {Promise<Object>} Inventory-enriched product data
 */
async function executeInventoryEnrichment(params) {
  const { products, config, actionParams, trace } = params;

  try {
    // Extract SKUs from products
    const skus = extractProductSkus(products);

    if (!skus.length) {
      return {
        success: true,
        enrichedProducts: products,
        inventoryStats: {
          totalSkus: 0,
          productsEnriched: 0,
        },
      };
    }

    // Fetch inventory data
    const inventoryResponses = await retryWithAuthHandling(
      () => orchestrateInventoryRequests(skus, config, actionParams, trace),
      { maxRetries: 2 }
    );

    // Process inventory data
    const inventoryData = orchestrateDataProcessing({ inventory: inventoryResponses }, config, {
      validate: false,
    });

    // Apply inventory enrichment
    const enrichmentResult = enrichProductData(
      products,
      {},
      inventoryData.processing.inventoryProcessing || {},
      { includeCategories: false, includeInventory: true }
    );

    return {
      success: true,
      enrichedProducts: enrichmentResult.enrichedProducts,
      inventoryStats: {
        totalSkus: skus.length,
        productsEnriched: enrichmentResult.enrichmentStats.inventoryEnriched,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        workflow: 'inventory-enrichment',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        workflow: 'inventory-enrichment',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Executes a media/image enrichment workflow
 * @param {Object} params - Media enrichment parameters
 * @param {Array<Object>} params.products - Product data
 * @param {Object} params.config - Configuration object
 * @returns {Promise<Object>} Media-enriched product data
 */
async function executeMediaEnrichment(params) {
  const { products, config } = params;

  try {
    let mediaEnriched = 0;

    const enrichedProducts = products.map((product) => {
      if (product.media_gallery_entries && Array.isArray(product.media_gallery_entries)) {
        // Process media gallery entries
        const processedMedia = product.media_gallery_entries.map((entry) => ({
          ...entry,
          processed_url: entry.url || entry.file ? buildMediaUrl(entry, config) : null,
          alt_text: entry.label || product.name || '',
          position: entry.position || 0,
        }));

        if (processedMedia.length > 0) {
          mediaEnriched++;
        }

        return {
          ...product,
          media_gallery_entries: processedMedia,
          images: processedMedia.filter((media) => media.processed_url),
        };
      }

      return product;
    });

    return {
      success: true,
      enrichedProducts,
      mediaStats: {
        totalProducts: products.length,
        productsEnriched: mediaEnriched,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        workflow: 'media-enrichment',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        workflow: 'media-enrichment',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Helper Functions

/**
 * Analyzes enrichment needs based on product data and options
 * @param {Array<Object>} products - Product data
 * @param {Object} options - Enrichment options
 * @returns {Object} Enrichment requirements
 */
function analyzeEnrichmentNeeds(products, options) {
  const needs = {
    categoryIds: new Set(),
    skus: new Set(),
    requiresCategories: options.includeCategories !== false,
    requiresInventory: options.includeInventory !== false,
  };

  products.forEach((product) => {
    // Collect SKUs for inventory
    if (product.sku && needs.requiresInventory) {
      needs.skus.add(product.sku);
    }

    // Collect category IDs
    if (needs.requiresCategories) {
      extractCategoryIds([product]).forEach((id) => needs.categoryIds.add(id));
    }
  });

  return {
    categoryIds: Array.from(needs.categoryIds),
    skus: Array.from(needs.skus),
    requiresCategories: needs.requiresCategories,
    requiresInventory: needs.requiresInventory,
  };
}

/**
 * Fetches additional data needed for enrichment
 * @param {Object} needs - Enrichment needs analysis
 * @param {Object} config - Configuration object
 * @param {Object} actionParams - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Object>} Additional data
 */
async function fetchAdditionalData(needs, config, actionParams, trace) {
  const fetchPromises = [];

  // Fetch categories if needed
  if (needs.requiresCategories && needs.categoryIds.length > 0) {
    fetchPromises.push(
      orchestrateCategoryRequests(needs.categoryIds, config, actionParams, trace)
        .then((categories) => ({ type: 'categories', data: categories }))
        .catch(() => ({ type: 'categories', data: [] }))
    );
  }

  // Fetch inventory if needed
  if (needs.requiresInventory && needs.skus.length > 0) {
    fetchPromises.push(
      orchestrateInventoryRequests(needs.skus, config, actionParams, trace)
        .then((inventory) => ({ type: 'inventory', data: inventory }))
        .catch(() => ({ type: 'inventory', data: [] }))
    );
  }

  const results = await Promise.all(fetchPromises);

  // Process results into maps
  const additionalData = {
    categoryMap: {},
    inventoryMap: {},
  };

  results.forEach((result) => {
    if (result.type === 'categories') {
      const processed = orchestrateDataProcessing({ categories: result.data }, config);
      additionalData.categoryMap = processed.processing?.categoryProcessing || {};
    } else if (result.type === 'inventory') {
      const processed = orchestrateDataProcessing({ inventory: result.data }, config);
      additionalData.inventoryMap = processed.processing?.inventoryProcessing || {};
    }
  });

  return additionalData;
}

/**
 * Extracts category IDs from products
 * @param {Array<Object>} products - Product data
 * @returns {Array<string>} Category IDs
 */
function extractCategoryIds(products) {
  const categoryIds = new Set();

  products.forEach((product) => {
    if (Array.isArray(product.categories)) {
      product.categories.forEach((category) => {
        if (category.id) {
          categoryIds.add(String(category.id));
        } else if (typeof category === 'string' || typeof category === 'number') {
          categoryIds.add(String(category));
        }
      });
    }
  });

  return Array.from(categoryIds);
}

/**
 * Extracts SKUs from products
 * @param {Array<Object>} products - Product data
 * @returns {Array<string>} Product SKUs
 */
function extractProductSkus(products) {
  return products
    .map((product) => product.sku)
    .filter(Boolean)
    .map(String);
}

/**
 * Builds media URL from media entry
 * @param {Object} entry - Media gallery entry
 * @param {Object} config - Configuration object
 * @returns {string} Media URL
 */
function buildMediaUrl(entry, config) {
  if (entry.url) {
    return entry.url;
  }

  if (entry.file) {
    const baseMediaUrl = config.commerce.mediaBaseUrl || config.commerce.baseUrl;
    return `${baseMediaUrl}/media/catalog/product${entry.file}`;
  }

  return null;
}

module.exports = {
  executeProductEnrichment,
  executeCategoryEnrichment,
  executeInventoryEnrichment,
  executeMediaEnrichment,
  analyzeEnrichmentNeeds,
  extractCategoryIds,
  extractProductSkus,
};
