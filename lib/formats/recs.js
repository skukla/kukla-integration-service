/**
 * RECS Format Implementation
 * Fully self-contained - all RECS data, structure, and business logic in one place
 */

/**
 * Generic product transformation utilities (can be used by any format)
 */
/**
 * RECS-specific URL generation utilities
 */
const RecsUrlUtils = {
  /**
   * Extract URL key from product custom attributes
   */
  extractUrlKey(product) {
    if (!product.custom_attributes || !Array.isArray(product.custom_attributes)) {
      return null;
    }

    const urlKeyAttr = product.custom_attributes.find((attr) => attr.attribute_code === 'url_key');
    return urlKeyAttr ? urlKeyAttr.value : null;
  },

  /**
   * Generate RECS page_url from Commerce url_key
   * Uses url_key from custom attributes to create relative URL: /{url_key}.html
   * Returns empty string if url_key is not available (RECS requirement)
   */
  generatePageUrl(product) {
    const urlKey = this.extractUrlKey(product);
    return urlKey ? `/${urlKey}.html` : '';
  },
};

const ProductTransform = {
  /**
   * Get first category name from product (for RECS category_id field)
   */
  getFirstCategoryName(product) {
    if (!product.categories || !Array.isArray(product.categories)) {
      return '';
    }
    return product.categories[0]?.name || '';
  },

  /**
   * Get thumbnail image URL from product
   * Looks for image with 'thumbnail' type, falls back to first available image
   */
  getThumbnailImageUrl(product) {
    if (!product.images || !Array.isArray(product.images)) {
      return '';
    }

    // First, try to find an image specifically marked as thumbnail
    const thumbnailImage = product.images.find(
      (img) => img.types && Array.isArray(img.types) && img.types.includes('thumbnail')
    );

    if (thumbnailImage && thumbnailImage.url) {
      return thumbnailImage.url;
    }

    // Fallback: use the first available image URL
    const firstImageWithUrl = product.images.find((img) => img.url);
    return firstImageWithUrl ? firstImageWithUrl.url : '';
  },

  /**
   * Safe numeric conversion
   */
  toNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  },
};

/**
 * RECS Format - Fully Self-Contained Implementation
 * All RECS-specific data, structure, and business logic in one place
 */
const RecsFormat = {
  /**
   * RECS file headers - moved from config for complete encapsulation
   */
  getFileHeaders() {
    return [
      '## RECSRecommendations Upload File',
      "## RECS''## RECS'' indicates a Recommendations pre-process header. Please do not remove these lines.",
      '## RECS',
      '## RECSUse this file to upload product display information to Recommendations. Each product has its own row. Each line must contain 19 values and if not all are filled a space should be left.',
      "## RECSThe last 100 columns (entity.custom1 - entity.custom100) are custom. The name 'customN' can be replaced with a custom name such as 'onSale' or 'brand'.",
      "## RECSIf the products already exist in Recommendations then changes uploaded here will override the data in Recommendations. Any new attributes entered here will be added to the product''s entry in Recommendations.",
    ];
  },

  /**
   * RECS CSV column headers - moved from config
   */
  getColumnHeaders() {
    return [
      '##RECSentity.id',
      'entity.name',
      'entity.categoryId',
      'entity.message',
      'entity.thumbnailUrl',
      'entity.value',
      'entity.pageUrl',
      'entity.inventory',
      'entity.margin',
      'entity.type',
      'entity.custom2',
      'entity.custom3',
      'entity.custom4',
      'entity.custom5',
      'entity.custom6',
      'entity.custom7',
      'entity.custom8',
      'entity.custom9',
      'entity.custom10',
    ];
  },

  /**
   * RECS field order for CSV output - matches column headers
   */
  getFieldOrder() {
    return [
      'sku',
      'name',
      'category_id',
      'message',
      'thumbnail_url',
      'value',
      'page_url',
      'inventory',
      'margin',
      'type',
      'custom2',
      'custom3',
      'custom4',
      'custom5',
      'custom6',
      'custom7',
      'custom8',
      'custom9',
      'custom10',
    ];
  },

  /**
   * Complete RECS product transformation - fully self-contained
   * No dependency on external configuration for field mappings
   */
  transformProduct(product) {
    return {
      // Basic RECS fields - all mappings defined here
      sku: product.sku || '',
      name: product.name || '',
      category_id: ProductTransform.getFirstCategoryName(product),
      message: product.message || '',
      thumbnail_url: ProductTransform.getThumbnailImageUrl(product),
      value: ProductTransform.toNumber(product.price),
      page_url: RecsUrlUtils.generatePageUrl(product),
      inventory: ProductTransform.toNumber(product.qty, 0),
      margin: product.margin || '',
      type: product.type_id || 'product',
      // Custom fields - RECS requires custom2-custom10
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
  },
};

module.exports = RecsFormat;
