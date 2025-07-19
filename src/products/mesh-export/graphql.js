/**
 * Mesh Export - GraphQL Sub-module
 * All GraphQL query building utilities for API Mesh export
 */

// GraphQL Workflows

/**
 * Build enriched products GraphQL query
 * @purpose Create GraphQL query for fetching enriched product data from API Mesh
 * @param {Object} config - Configuration object
 * @returns {string} GraphQL query string for enriched products
 * @usedBy fetchEnrichedProductsFromMesh in mesh-export.js
 * @config mesh.query (optional custom query)
 */
function buildEnrichedProductsQuery(config) {
  // Use configured query or default enriched products query
  if (config.mesh && config.mesh.query) {
    return config.mesh.query;
  }

  // Default enriched products query with all required data
  return `
    query GetEnrichedProducts {
      mesh_products_enriched {
        total_count
        products {
          sku
          name
          price
          type_id
          status
          visibility
          weight
          created_at
          updated_at
          qty
          is_in_stock
          categories {
            id
            name
            level
            path
          }
          media_gallery_entries {
            id
            file
            media_type
            label
            position
            disabled
          }
        }
      }
    }
  `;
}

// GraphQL Utiltiies

/**
 * Build custom GraphQL query with specific fields
 * @purpose Create customized GraphQL query based on requested fields
 * @param {Array} fields - Array of field names to include
 * @param {Object} config - Configuration object
 * @returns {string} Customized GraphQL query string
 * @usedBy Advanced mesh queries that need field selection
 */
function buildCustomProductsQuery(fields) {
  const productFields = fields.join('\n          ');

  return `
    query GetCustomProducts {
      mesh_products_enriched {
        total_count
        products {
          ${productFields}
        }
      }
    }
  `;
}

/**
 * Build GraphQL query for specific product SKUs
 * @purpose Create GraphQL query to fetch specific products by SKU
 * @param {Array} skus - Array of product SKUs to fetch
 * @param {Object} config - Configuration object
 * @returns {string} GraphQL query string for specific products
 * @usedBy Targeted product fetching by SKU
 */
function buildProductsBySkuQuery(skus) {
  const skuFilter = skus.map((sku) => `"${sku}"`).join(', ');

  return `
    query GetProductsBySku {
      mesh_products_enriched(skus: [${skuFilter}]) {
        total_count
        products {
          sku
          name
          price
          qty
          is_in_stock
          categories {
            id
            name
          }
        }
      }
    }
  `;
}

/**
 * Validate GraphQL query syntax
 * @purpose Basic validation of GraphQL query structure
 * @param {string} query - GraphQL query string
 * @returns {boolean} True if query appears valid
 * @usedBy Query validation before sending to API Mesh
 */
function validateGraphQLQuery(query) {
  if (!query || typeof query !== 'string') {
    return false;
  }

  // Basic GraphQL syntax checks
  const hasQuery = query.includes('query');
  const hasOpenBrace = query.includes('{');
  const hasCloseBrace = query.includes('}');

  return hasQuery && hasOpenBrace && hasCloseBrace;
}

module.exports = {
  // Workflows
  buildEnrichedProductsQuery,

  // Utilities
  buildCustomProductsQuery,
  buildProductsBySkuQuery,
  validateGraphQLQuery,
};
