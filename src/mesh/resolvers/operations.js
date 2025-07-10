/**
 * Mesh Resolvers - Operations Domain
 * Data processing operations for mesh resolvers
 *
 * This file contains mid-level business processes following our domain-driven architecture.
 * Operations coordinate between utils and workflows.
 */

// Import utilities - none needed for operations
// Note: In actual mesh environment, all code will be embedded during generation

// =============================================================================
// AUTHENTICATION OPERATIONS
// =============================================================================

/**
 * Extract OAuth credentials from context headers
 * Business operation that validates and extracts OAuth parameters
 * @param {Object} context - GraphQL context with headers
 * @returns {Object} OAuth parameters object
 * @throws {Error} If OAuth credentials are missing
 */
function extractOAuthCredentials(context) {
  const oauthParams = {
    consumerKey: context.headers['x-commerce-consumer-key'],
    consumerSecret: context.headers['x-commerce-consumer-secret'],
    accessToken: context.headers['x-commerce-access-token'],
    accessTokenSecret: context.headers['x-commerce-access-token-secret'],
  };

  if (
    !oauthParams.consumerKey ||
    !oauthParams.consumerSecret ||
    !oauthParams.accessToken ||
    !oauthParams.accessTokenSecret
  ) {
    throw new Error(
      'OAuth credentials required in headers: x-commerce-consumer-key, x-commerce-consumer-secret, x-commerce-access-token, x-commerce-access-token-secret'
    );
  }

  return oauthParams;
}

// =============================================================================
// DATA EXTRACTION OPERATIONS
// =============================================================================

/**
 * Extract category IDs and SKUs from products
 * Mirrors our src/products/utils/category.js extraction patterns
 * @param {Array} products - Array of product objects
 * @returns {Object} Object with categoryIds Set and skus Array
 */
function extractProductIdentifiers(products) {
  const categoryIds = new Set();
  const skus = [];

  products.forEach((product) => {
    // Extract SKUs
    if (product.sku) {
      skus.push(product.sku);
    }

    // Extract category IDs from custom attributes
    if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
      product.custom_attributes.forEach((attr) => {
        if (attr.attribute_code === 'category_ids' && attr.value) {
          try {
            const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
            ids.forEach((id) => categoryIds.add(id.toString()));
          } catch (e) {
            // Skip invalid category IDs
          }
        }
      });
    }
  });

  return { categoryIds, skus };
}

// =============================================================================
// DATA ENRICHMENT OPERATIONS
// =============================================================================

/**
 * Enrich products with category and inventory data
 * Pure function following our enrichment patterns
 * @param {Array} products - Array of products
 * @param {Object} categoryMap - Category data map
 * @param {Object} inventoryMap - Inventory data map
 * @returns {Array} Enriched products
 */
function enrichProductsWithData(products, categoryMap, inventoryMap) {
  return products.map((product) => {
    const sku = product.sku;
    const inventory = inventoryMap[sku] || { qty: 0, is_in_stock: false };

    // Extract category objects from custom attributes
    let categoryObjects = [];
    if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
      product.custom_attributes.forEach((attr) => {
        if (attr.attribute_code === 'category_ids' && attr.value) {
          try {
            const ids = Array.isArray(attr.value) ? attr.value : attr.value.split(',');
            categoryObjects = ids
              .map((id) => categoryMap[id.toString()])
              .filter((cat) => cat)
              .map((cat) => ({ id: cat.id, name: cat.name }));
          } catch (e) {
            // Skip invalid category data
          }
        }
      });
    }

    // Sort media_gallery_entries to prioritize AEM URLs
    let sortedMediaGallery = [];
    if (product.media_gallery_entries && Array.isArray(product.media_gallery_entries)) {
      sortedMediaGallery = [...product.media_gallery_entries].sort((a, b) => {
        const aIsUrl = a.file && a.file.startsWith('http');
        const bIsUrl = b.file && b.file.startsWith('http');

        // AEM URLs (starting with http) should come first
        if (aIsUrl && !bIsUrl) return -1;
        if (!aIsUrl && bIsUrl) return 1;

        // If both are URLs or both are paths, maintain original order
        return 0;
      });
    }

    // Return RAW consolidated data - let buildProducts step handle transformation
    return {
      ...product,
      qty: inventory.qty,
      categories: categoryObjects, // Raw category objects with id/name
      inventory: inventory,
      media_gallery_entries: sortedMediaGallery, // AEM URLs prioritized over catalog paths
    };
  });
}

// Export functions for use in other resolver files
module.exports = {
  // Authentication operations
  extractOAuthCredentials,

  // Data extraction operations
  extractProductIdentifiers,

  // Data enrichment operations
  enrichProductsWithData,
};
