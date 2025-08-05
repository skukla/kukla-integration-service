/**
 * Simplified Adobe App Builder Configuration
 * Direct configuration without over-engineered domain abstractions
 */

/**
 * Configuration factory function for Adobe I/O Runtime
 * Takes action parameters since process.env is not available in runtime
 * @param {Object} params - Action parameters containing environment variables
 * @returns {Object} Configuration object
 */
// eslint-disable-next-line max-lines-per-function
function createConfig(params = {}) {
  return {
    // Commerce API Configuration
    commerce: {
      baseUrl: params.COMMERCE_BASE_URL,
      adminUsername: params.COMMERCE_ADMIN_USERNAME,
      adminPassword: params.COMMERCE_ADMIN_PASSWORD,
      api: {
        version: 'V1',
        paths: {
          products: '/products',
          categories: '/categories',
          stockItems: '/stockItems',
          adminToken: '/integration/admin/token',
        },
      },
      batching: {
        inventory: 50,
        categories: 20,
      },
    },

    // API Mesh Configuration
    mesh: {
      endpoint: params.API_MESH_ENDPOINT,
      apiKey: params.MESH_API_KEY,
      categoryDisplayLimit: 10,
      categoryBatchThreshold: 1,
      inventoryBatchThreshold: 1,
    },

    // Storage Configuration
    storage: {
      provider: 's3',
      directory: 'public/',
    },

    // S3 Configuration (when using S3 provider)
    s3: {
      region: 'us-east-1',
      bucketName: 'demo-commerce-integrations',
      prefix: 'kukla-integration/',
      accessKeyId: params.AWS_ACCESS_KEY_ID,
      secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
    },

    // Product Export Configuration
    products: {
      expectedCount: 119,
      maxCategoriesDisplay: 10,
      exportFields: ['sku', 'name', 'price', 'qty', 'categories', 'images'],
      defaultFilename: 'products.csv',
    },

    // CSV Export Configuration
    csv: {
      // RECS header rows that must appear before the data
      recsHeaders: [
        '## RECSRecommendations Upload File',
        "## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
        '## RECS',
        '## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.',
        "## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.",
        "## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.",
      ],

      // CSV header definitions for product export
      headers: [
        { id: 'sku', title: '##RECSentity.id' },
        { id: 'name', title: 'entity.name' },
        { id: 'category_id', title: 'entity.categoryId' },
        { id: 'message', title: 'entity.message' },
        { id: 'thumbnail_url', title: 'entity.thumbnailUrl' },
        { id: 'value', title: 'entity.value' },
        { id: 'page_url', title: 'entity.pageUrl' },
        { id: 'inventory', title: 'entity.inventory' },
        { id: 'margin', title: 'entity.margin' },
        { id: 'type', title: 'entity.type' },
        { id: 'custom2', title: 'entity.custom2' },
        { id: 'custom3', title: 'entity.custom3' },
        { id: 'custom4', title: 'entity.custom4' },
        { id: 'custom5', title: 'entity.custom5' },
        { id: 'custom6', title: 'entity.custom6' },
        { id: 'custom7', title: 'entity.custom7' },
        { id: 'custom8', title: 'entity.custom8' },
        { id: 'custom9', title: 'entity.custom9' },
        { id: 'custom10', title: 'entity.custom10' },
      ],

      // Product field mappings for transformation
      fieldMappings: {
        // Basic field mappings
        basic: {
          sku: 'sku',
          name: 'name',
          price: 'price',
          qty: 'qty',
        },

        // Category processing configuration
        categories: {
          sourceField: 'categories',
          nameField: 'name',
          fallbackField: 'id',
          joinSeparator: ', ',
          categoryIdSource: 0, // Use first category for category_id
        },

        // Image processing configuration
        images: {
          sourceField: 'images',
          urlField: 'url',
          thumbnailIndex: 0, // Use first image for thumbnail
          joinSeparator: ', ',
        },

        // RECS-specific field mappings
        recs: {
          message: 'message',
          value: 'price', // Map to price
          page_url: '', // Empty by default
          inventory: 'qty', // Map to qty
          margin: 'margin',
          type: 'type',
        },

        // Custom fields configuration
        custom: {
          count: 9, // custom2 through custom10
          startIndex: 2,
          defaultValue: '',
        },
      },
    },
  };
}

module.exports = createConfig;
