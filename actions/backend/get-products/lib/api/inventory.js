/**
 * Inventory API client
 * @module lib/api/inventory
 */

const { loadConfig } = require('../../../../../config');
const { buildCommerceUrl } = require('../../../../../src/core/routing');
const { getAuthToken } = require('../auth');

/**
 * Get inventory data for a list of SKUs
 * @param {string[]} skus - List of product SKUs
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Inventory data keyed by SKU
 */
async function getInventory(skus, params) {
  const config = loadConfig(params);
  const token = await getAuthToken(params);
  const url = buildCommerceUrl(config.commerce.baseUrl, config.commerce.paths.stockItem);

  // Batch SKUs into groups of 20 to avoid URL length limits
  const batchSize = 20;
  const batches = [];
  for (let i = 0; i < skus.length; i += batchSize) {
    batches.push(skus.slice(i, i + batchSize));
  }

  const results = {};

  // Process each batch
  for (const batchSkus of batches) {
    const searchCriteria = {
      filterGroups: [
        {
          filters: [
            {
              field: 'sku',
              value: batchSkus.join(','),
              conditionType: 'in',
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${url}?${new URLSearchParams({
        searchCriteria: JSON.stringify(searchCriteria),
      })}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory data: ${response.statusText}`);
    }

    const data = await response.json();

    // Process inventory data
    for (const item of data.items || []) {
      if (!results[item.sku]) {
        results[item.sku] = {
          qty: 0,
          is_in_stock: false,
        };
      }

      // Sum quantities across all sources
      results[item.sku].qty += parseFloat(item.quantity) || 0;

      // Product is in stock if any source has it in stock
      results[item.sku].is_in_stock = results[item.sku].is_in_stock || item.status === 1;
    }
  }

  return results;
}

module.exports = {
  getInventory,
};
