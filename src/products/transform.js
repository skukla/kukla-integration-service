/**
 * Products Domain - Transform Module
 *
 * Consolidates all product transformation and CSV generation functionality.
 * Following functional composition principles with pure functions
 * and clear input/output contracts.
 *
 * Migrated from:
 * - actions/backend/get-products/steps/buildProducts.js
 * - actions/backend/get-products/steps/createCsv.js
 * - src/commerce/transform/product.js
 */

const { generateCsv } = require('../files').csv;

/**
 * RECS header rows that must appear before the data
 * @constant {Array<string>}
 */
const RECS_HEADERS = [
  '## RECSRecommendations Upload File',
  "## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
  '## RECS',
  '## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.',
  "## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.",
  "## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.",
];

/**
 * CSV header definitions for product export
 * @constant {Array<Object>}
 */
const CSV_HEADERS = [
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
];

/**
 * Transforms a media gallery entry into a simplified image object.
 * @private
 * @param {Object} img - Media gallery entry from Adobe Commerce
 * @param {string} img.file - Image file path
 * @param {number} img.position - Image position/order
 * @param {Array<string>} [img.types] - Image type/role identifiers
 * @returns {Object} Simplified image object
 */
function transformImageEntry(img) {
  // Determine the appropriate URL
  let url;
  if (img.url) {
    // Use the provided URL if available
    url = img.url;
  } else if (img.file && img.file.startsWith('http')) {
    // If file is already a full URL, use it directly
    url = img.file;
  } else {
    // Construct catalog URL for relative paths
    url = `catalog/product${img.file}`;
  }

  const imageObj = {
    filename: img.file,
    url: url,
    position: img.position,
  };
  if (img.types && img.types.length > 0) {
    imageObj.roles = img.types;
  }
  return imageObj;
}

/**
 * Gets the primary image URL from a product's images array
 * @private
 * @param {Object[]} [images] - Array of product image objects
 * @returns {string} Primary image URL or empty string if none exists
 */
function getPrimaryImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }
  // Handle both URL and filename formats
  return images[0].url || images[0].filename || '';
}

/**
 * Get category IDs from a product
 * @private
 * @param {Object} product - Product object
 * @returns {Array<number>} Array of category IDs
 */
function getCategoryIds(product) {
  const categoryIds = [];

  // Check direct categories array
  if (product.categories && Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      if (cat.id) {
        categoryIds.push(parseInt(cat.id));
      }
    });
  }

  // Check custom_attributes for category_ids
  if (product.custom_attributes && Array.isArray(product.custom_attributes)) {
    const categoryAttr = product.custom_attributes.find(
      (attr) => attr.attribute_code === 'category_ids'
    );
    if (categoryAttr && categoryAttr.value) {
      const catIds = categoryAttr.value.split(',');
      catIds.forEach((id) => {
        const categoryId = parseInt(id.trim());
        if (!isNaN(categoryId) && !categoryIds.includes(categoryId)) {
          categoryIds.push(categoryId);
        }
      });
    }
  }

  return categoryIds;
}

/**
 * Builds a product object with all fields.
 * Pure function that transforms Commerce API product data into standardized format.
 *
 * @param {Object} product - The product object from Adobe Commerce
 * @param {Object<string, string>} categoryMap - Map of category IDs to names
 * @returns {Object} Transformed product object
 */
function buildProductObject(product, categoryMap = {}) {
  return {
    sku: product.sku || '',
    name: product.name || '',
    price: product.price || 0,
    qty: product.qty || 0,
    categories: (() => {
      // If categories are already enriched (have name property), use them directly
      if (
        product.categories &&
        Array.isArray(product.categories) &&
        product.categories.length > 0 &&
        product.categories[0].name
      ) {
        return product.categories.map((cat) => cat.name);
      }
      // Otherwise, use the category mapping approach
      const categoryIds = getCategoryIds(product);
      const categoryNames = categoryIds.map((id) => categoryMap[String(id)]).filter(Boolean);
      return categoryNames;
    })(),
    images: (product.media_gallery_entries || []).map(transformImageEntry),
    performance: {
      productCount: 1,
      categoryCount: product.categories ? product.categories.length : 0,
    },
  };
}

/**
 * Extracts primary category for CSV output
 * @param {Array|undefined} categories - Product categories array
 * @returns {string} Primary category ID or name
 */
function extractCsvCategoryId(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '';
  }

  const firstCategory = categories[0];

  // Handle string category IDs
  if (typeof firstCategory === 'string') {
    return firstCategory;
  }

  // Handle category objects with name property
  if (firstCategory && firstCategory.name) {
    return firstCategory.name;
  }

  return '';
}

/**
 * Maps a product object to a CSV row
 * Pure function that converts product data to CSV row format.
 *
 * @param {Object} product - Product object
 * @returns {Object} CSV row object
 */
function mapProductToCsvRow(product) {
  return {
    sku: product.sku || '',
    name: product.name || '',
    category_id: extractCsvCategoryId(product.categories),
    message: product.description || '',
    thumbnail_url: getPrimaryImageUrl(product.images),
    value: product.price || '',
    page_url: product.url || '',
    inventory: product.qty || '',
    margin: product.margin || '',
    type: product.type_id || '',
    custom2: '',
    custom3: '',
    custom4: '',
    custom5: '',
    custom6: '',
    custom7: '',
    custom8: '',
    custom9: '',
    custom10: '',
  };
}

/**
 * Transforms raw product data into the required format
 * Pure function that processes an array of products through standardization.
 *
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @returns {Promise<Object[]>} Transformed product objects ready for CSV
 * @throws {Error} If product transformation fails
 */
async function buildProducts(products) {
  try {
    // Build category map from enriched products
    const categoryMap = {};
    products.forEach((product) => {
      if (product.categories) {
        product.categories.forEach((category) => {
          categoryMap[category.id] = category.name;
        });
      }
    });

    // Transform each product
    return products.map((product) => buildProductObject(product, categoryMap));
  } catch (error) {
    throw new Error(`Failed to build products: ${error.message}`);
  }
}

/**
 * Creates a CSV file from product data
 * Pure function that generates CSV content from product objects.
 *
 * @param {Object[]} products - Array of product objects
 * @returns {Promise<Object>} CSV generation result
 * @throws {Error} If CSV generation fails
 */
async function createCsv(products) {
  try {
    // Try using the core CSV generation first
    try {
      const result = await generateCsv({
        records: products,
        headers: CSV_HEADERS,
        rowMapper: mapProductToCsvRow,
        compression: false, // Disable compression to avoid dependency issues
        preContent: RECS_HEADERS.join('\n') + '\n', // Add RECS headers before CSV data
      });

      // Convert Buffer to string for compatibility
      return {
        content: result.content.toString(),
        stats: result.stats,
      };
    } catch (coreError) {
      // Log core module failure before falling back
      console.warn(`Core CSV generation failed: ${coreError.message}`);
      throw coreError; // Re-throw to trigger fallback
    }
  } catch (error) {
    try {
      // Fallback to simple CSV generation if core module fails
      const headers = CSV_HEADERS.map((h) => h.title).join(',');
      const rows = products.map((product) => {
        const mapped = mapProductToCsvRow(product);
        return CSV_HEADERS.map((h) => mapped[h.id] || '').join(',');
      });

      // Add RECS headers and CSV content
      const csvContent = [...RECS_HEADERS, headers, ...rows].join('\n');

      return {
        content: csvContent,
        stats: {
          originalSize: csvContent.length,
          compressedSize: csvContent.length,
          savingsPercent: 0,
          rowCount: products.length,
        },
      };
    } catch (fallbackError) {
      // If both methods fail, throw a descriptive error
      throw new Error(
        `Failed to create CSV: Primary method failed (${error.message}), fallback method also failed (${fallbackError.message})`
      );
    }
  }
}

/**
 * Complete product transformation pipeline
 * Composition function that combines product building and CSV generation.
 *
 * @param {Object[]} products - Raw product data from Adobe Commerce
 * @returns {Promise<Object>} CSV generation result with transformed products
 * @throws {Error} If transformation or CSV generation fails
 */
async function buildProductCsv(products) {
  try {
    // Transform products first
    const builtProducts = await buildProducts(products);

    // Generate CSV from transformed products
    const csvResult = await createCsv(builtProducts);

    return {
      ...csvResult,
      transformedProducts: builtProducts,
    };
  } catch (error) {
    throw new Error(`Product CSV transformation failed: ${error.message}`);
  }
}

module.exports = {
  buildProductObject,
  mapProductToCsvRow,
  buildProducts,
  createCsv,
  buildProductCsv,
  // Constants
  RECS_HEADERS,
  CSV_HEADERS,
};
