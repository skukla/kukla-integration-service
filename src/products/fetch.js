/**
 * Products Domain - Fetch Module
 *
 * Consolidates all product fetching and enrichment functionality.
 * Following functional composition principles with pure functions
 * and clear input/output contracts.
 *
 * Migrated from:
 * - actions/backend/get-products/steps/fetchAndEnrichProducts.js
 * - actions/backend/get-products/lib/api/products.js
 * - actions/backend/get-products/lib/api/categories.js
 * - actions/backend/get-products/lib/api/inventory.js
 */

const { makeCommerceRequest } = require('../commerce').api;

/**
 * Fetch products from Commerce API with OAuth authentication
 * Pure function that fetches and enriches products with category and inventory data.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of enriched product objects
 */
async function fetchProducts(params, config, trace = null) {
  const commerceUrl = config.commerce.baseUrl;

  if (!commerceUrl) {
    throw new Error('Commerce URL not configured in environment');
  }

  try {
    // Fetch all products with pagination
    let allProducts = [];
    let currentPage = 1;
    const pageSize = config.products.batchSize || 50;
    const maxPages = 10; // Reasonable default

    do {
      const response = await makeCommerceRequest(
        `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}&fields=items[id,sku,name,price,status,type_id,attribute_set_id,created_at,updated_at,weight,categories,media_gallery_entries[file,url,position,types],custom_attributes],total_count`,
        {
          method: 'GET',
        },
        params,
        trace
      );

      if (!response.body || !response.body.items || !Array.isArray(response.body.items)) {
        break;
      }

      allProducts = allProducts.concat(response.body.items);

      // Check if we have more pages
      const totalCount = response.body.total_count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      if (currentPage >= totalPages || currentPage >= maxPages) {
        break;
      }

      currentPage++;
    } while (currentPage <= maxPages);

    return allProducts;
  } catch (error) {
    throw new Error(`Commerce API failed: ${error.message}`);
  }
}

/**
 * Enrich products with category data
 * Pure function that adds category information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with categories
 */
async function enrichWithCategories(products, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  try {
    // Extract unique category IDs from all products
    const categoryIds = new Set();
    products.forEach((product) => {
      if (product.categories) {
        product.categories.forEach((cat) => {
          if (cat.id) categoryIds.add(cat.id);
        });
      }
      // Also check custom_attributes for category_ids
      if (product.custom_attributes) {
        const categoryAttr = product.custom_attributes.find(
          (attr) => attr.attribute_code === 'category_ids'
        );
        if (categoryAttr && categoryAttr.value) {
          const catIds = categoryAttr.value.split(',');
          catIds.forEach((id) => categoryIds.add(parseInt(id.trim())));
        }
      }
    });

    if (categoryIds.size === 0) {
      return products;
    }

    // Fetch category data
    const categoryMap = {};
    const categoryIdsArray = Array.from(categoryIds);

    // Batch category requests to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < categoryIdsArray.length; i += batchSize) {
      const batch = categoryIdsArray.slice(i, i + batchSize);
      const categoryPromises = batch.map(async (categoryId) => {
        try {
          const response = await makeCommerceRequest(
            `/categories/${categoryId}`,
            { method: 'GET' },
            params,
            trace
          );

          if (response.body && response.body.id && response.body.name) {
            categoryMap[response.body.id] = {
              id: response.body.id,
              name: response.body.name,
              parent_id: response.body.parent_id,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch category ${categoryId}: ${error.message}`);
        }
      });

      await Promise.all(categoryPromises);

      // Add delay between batches
      if (i + batchSize < categoryIdsArray.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Enrich products with category data
    return products.map((product) => {
      const enrichedProduct = { ...product };

      // Build categories array from available data
      const productCategories = [];

      if (product.categories) {
        product.categories.forEach((cat) => {
          if (categoryMap[cat.id]) {
            productCategories.push(categoryMap[cat.id]);
          }
        });
      }

      // Also check custom_attributes for additional categories
      if (product.custom_attributes) {
        const categoryAttr = product.custom_attributes.find(
          (attr) => attr.attribute_code === 'category_ids'
        );
        if (categoryAttr && categoryAttr.value) {
          const catIds = categoryAttr.value.split(',');
          catIds.forEach((id) => {
            const categoryId = parseInt(id.trim());
            if (categoryMap[categoryId] && !productCategories.find((c) => c.id === categoryId)) {
              productCategories.push(categoryMap[categoryId]);
            }
          });
        }
      }

      enrichedProduct.categories = productCategories;
      return enrichedProduct;
    });
  } catch (error) {
    console.warn(`Category enrichment failed: ${error.message}`);
    return products; // Return products without category enrichment
  }
}

/**
 * Enrich products with inventory data
 * Pure function that adds inventory information to products.
 *
 * @param {Array} products - Array of product objects
 * @param {Object} params - Action parameters
 * @param {Object} [trace] - Optional trace context
 * @returns {Promise<Array>} Array of products enriched with inventory
 */
async function enrichWithInventory(products, params, trace = null) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  try {
    // Get SKUs for inventory lookup
    const skus = products.map((product) => product.sku).filter(Boolean);
    if (skus.length === 0) {
      return products;
    }

    // Fetch inventory data in batches
    const inventoryMap = {};
    const batchSize = 20;

    for (let i = 0; i < skus.length; i += batchSize) {
      const batch = skus.slice(i, i + batchSize);
      const inventoryPromises = batch.map(async (sku) => {
        try {
          const response = await makeCommerceRequest(
            `/stockItems/${sku}`,
            { method: 'GET' },
            params,
            trace
          );

          if (response.body) {
            inventoryMap[sku] = {
              qty: response.body.qty || 0,
              is_in_stock: response.body.is_in_stock || false,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch inventory for ${sku}: ${error.message}`);
          inventoryMap[sku] = { qty: 0, is_in_stock: false };
        }
      });

      await Promise.all(inventoryPromises);

      // Add delay between batches
      if (i + batchSize < skus.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Add inventory data to products
    return products.map((product) => ({
      ...product,
      qty: inventoryMap[product.sku]?.qty || 0,
      is_in_stock: inventoryMap[product.sku]?.is_in_stock || false,
    }));
  } catch (error) {
    console.warn(`Inventory enrichment failed: ${error.message}`);
    return products; // Return products without inventory enrichment
  }
}

/**
 * Fetch and enrich products with all data (categories and inventory)
 * Composition function that combines fetching with all enrichment steps.
 *
 * @param {Object} params - Action parameters with OAuth credentials
 * @param {Object} config - Configuration object with Commerce URL
 * @param {Object} [trace] - Optional trace context for API call tracking
 * @returns {Promise<Array>} Array of fully enriched product objects
 */
async function fetchAndEnrichProducts(params, config, trace = null) {
  try {
    console.log('Fetching products from Commerce API...');
    const products = await fetchProducts(params, config, trace);
    console.log(`Fetched ${products.length} products`);

    console.log(`Enriching ${products.length} products with category and inventory data...`);

    // Enrich with categories first, then inventory
    const categorizedProducts = await enrichWithCategories(products, params, trace);
    const fullyEnrichedProducts = await enrichWithInventory(categorizedProducts, params, trace);

    console.log(`Successfully enriched ${fullyEnrichedProducts.length} products`);
    return fullyEnrichedProducts;
  } catch (error) {
    throw new Error(`Product fetch and enrichment failed: ${error.message}`);
  }
}

module.exports = {
  fetchProducts,
  enrichWithCategories,
  enrichWithInventory,
  fetchAndEnrichProducts,
};
