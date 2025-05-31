/**
 * Performance test scenarios
 * @module core/testing/performance/scenarios
 */

const scenarios = [
  {
    name: 'small',
    description: 'Small dataset test (100 products)',
    params: {
      limit: 100,
      fields: 'sku,name,price',
      includeInventory: false,
      includeCategories: false,
    },
  },
  {
    name: 'medium',
    description: 'Medium dataset test (1000 products)',
    params: {
      limit: 1000,
      fields: 'sku,name,price,qty,categories',
      includeInventory: true,
      includeCategories: true,
    },
  },
  {
    name: 'large',
    description: 'Large dataset test (5000 products)',
    params: {
      limit: 5000,
      fields: 'sku,name,price,qty,categories,images,url_key,type_id,status',
      includeInventory: true,
      includeCategories: true,
    },
  },
];

module.exports = scenarios;
