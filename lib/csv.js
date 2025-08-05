/**
 * Configuration-driven CSV Generation for Adobe App Builder
 * Uses configuration objects for maintainable field mappings
 */

const createConfig = require('../config');

/**
 * Map product object to CSV row format using configuration
 * Contains the core business logic for RECS format transformation
 * @param {Object} product - Product data to map
 * @param {Object} config - Configuration object with CSV headers
 * @returns {Object} Mapped product data
 */
function mapProductToCsvRow(product, config) {
  const csvHeaders = config.csv.headers;
  return csvHeaders.reduce((mapped, header) => {
    mapped[header.id] = product[header.id] || '';
    return mapped;
  }, {});
}

/**
 * Create CSV content from products array using configuration
 * Configuration-driven approach for maintainable CSV generation
 *
 * @param {Array} products - Array of product objects
 * @param {Object} config - Configuration object with CSV settings
 * @returns {Object} CSV result with content and stats
 */
function createCsv(products, config) {
  const csvConfig = config.csv;

  // Create CSV header row
  const headers = csvConfig.headers.map((h) => h.title).join(',');

  // Create CSV data rows
  const rows = products.map((product) => {
    const mapped = mapProductToCsvRow(product, config);
    return csvConfig.headers
      .map((h) => {
        const value = mapped[h.id] || '';
        // Simple CSV escaping - wrap in quotes if contains comma
        return value.toString().includes(',') ? `"${value}"` : value;
      })
      .join(',');
  });

  // Combine RECS headers + CSV headers + data rows
  const csvContent = [...csvConfig.recsHeaders, headers, ...rows].join('\n');

  return {
    content: csvContent,
    stats: {
      originalSize: csvContent.length,
      compressedSize: csvContent.length,
      savingsPercent: 0,
      rowCount: products.length,
    },
  };
}

/**
 * Build products with configuration-driven transformation
 * Uses field mappings from configuration for maintainable transformations
 *
 * @param {Array} products - Raw product data
 * @param {Object} config - Configuration object with field mappings
 * @returns {Promise<Array>} Transformed products ready for CSV
 */
async function buildProducts(products, config) {
  if (!Array.isArray(products)) {
    return [];
  }

  // Use default config if not provided for backward compatibility
  const cfg = config || createConfig({});
  const mappings = cfg.csv.fieldMappings;

  try {
    // Transform each product using configuration
    return products.map((product) => {
      const transformed = {};

      // Basic field mapping using configuration
      Object.entries(mappings.basic).forEach(([targetField, sourceField]) => {
        if (targetField === 'price' || targetField === 'qty') {
          transformed[targetField] =
            targetField === 'price'
              ? parseFloat(product[sourceField]) || 0
              : parseInt(product[sourceField], 10) || 0;
        } else {
          transformed[targetField] = product[sourceField] || '';
        }
      });

      // Category processing using configuration
      const catConfig = mappings.categories;
      if (product[catConfig.sourceField] && Array.isArray(product[catConfig.sourceField])) {
        const categoryNames = product[catConfig.sourceField]
          .map((cat) => cat[catConfig.nameField] || cat[catConfig.fallbackField])
          .filter(Boolean);
        transformed.categories = categoryNames.join(catConfig.joinSeparator);
        transformed.category_id =
          product[catConfig.sourceField][catConfig.categoryIdSource]?.[catConfig.nameField] || '';
      } else {
        transformed.categories = '';
        transformed.category_id = '';
      }

      // Image processing using configuration
      const imgConfig = mappings.images;
      if (
        product[imgConfig.sourceField] &&
        Array.isArray(product[imgConfig.sourceField]) &&
        product[imgConfig.sourceField].length > 0
      ) {
        transformed.thumbnail_url =
          product[imgConfig.sourceField][imgConfig.thumbnailIndex]?.[imgConfig.urlField] || '';
        transformed.images = product[imgConfig.sourceField]
          .map((img) => img[imgConfig.urlField])
          .filter(Boolean)
          .join(imgConfig.joinSeparator);
      } else {
        transformed.thumbnail_url = '';
        transformed.images = '';
      }

      // RECS-specific field mappings using configuration
      const recsConfig = mappings.recs;
      Object.entries(recsConfig).forEach(([targetField, sourceField]) => {
        if (sourceField === '') {
          // Empty string means use default empty value
          transformed[targetField] = '';
        } else if (sourceField === 'price' || sourceField === 'qty') {
          // Map to existing transformed field
          transformed[targetField] = transformed[sourceField === 'price' ? 'price' : 'qty'] || 0;
        } else {
          // Direct field mapping
          transformed[targetField] = product[sourceField] || '';
        }
      });

      // Custom fields using configuration
      const customConfig = mappings.custom;
      const customFields = Object.fromEntries(
        Array.from({ length: customConfig.count }, (_, i) => [
          `custom${i + customConfig.startIndex}`,
          customConfig.defaultValue,
        ])
      );

      return { ...transformed, ...customFields };
    });
  } catch (error) {
    throw new Error(`Product transformation failed: ${error.message}`);
  }
}

module.exports = {
  createCsv,
  buildProducts,
  mapProductToCsvRow,
};
