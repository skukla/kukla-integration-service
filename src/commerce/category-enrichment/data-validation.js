/**
 * Category Enrichment - Data Validation Sub-module
 * All category data validation, enhancement, and normalization utilities
 */

// Data Validation Workflows

/**
 * Validate and apply fallback strategies to category map
 * @purpose Validate category data quality and apply fallback strategies for incomplete data
 * @param {Object} categoryMap - Map of category ID to category data
 * @param {Object} [options={}] - Validation and fallback options
 * @returns {Object} Enhanced category map with validated and fallback data
 * @usedBy enrichProductsWithCategoriesAndFallback
 */
function validateAndApplyFallbacks(categoryMap, options = {}) {
  const enhancedCategoryMap = {};

  Object.entries(categoryMap).forEach(([categoryId, category]) => {
    if (category) {
      enhancedCategoryMap[categoryId] = validateAndEnhanceCategoryData(category, options);
    } else {
      enhancedCategoryMap[categoryId] = applyFallbackCategoryStrategy(categoryId, options);
    }
  });

  return enhancedCategoryMap;
}

// Data Validation Utilities

/**
 * Validate and enhance individual category data
 * @purpose Validate category data structure and enhance with missing fields and metadata
 * @param {Object} category - Category data to validate and enhance
 * @param {Object} [options={}] - Validation options including fallback strategies
 * @returns {Object} Enhanced category data with validation metadata
 * @usedBy validateAndApplyFallbacks
 */
function validateAndEnhanceCategoryData(category, options = {}) {
  if (!category || typeof category !== 'object') {
    return null;
  }

  // Step 1: Normalize core fields
  const normalizedCategory = normalizeCategoryFields(category);

  // Step 2: Generate validation metadata
  const validationMetadata = generateCategoryValidationMetadata(normalizedCategory);

  // Step 3: Apply validation options if provided
  const enhanceMetadata = options.enhanceMetadata !== false;

  return {
    ...normalizedCategory,
    validationMetadata: enhanceMetadata ? validationMetadata : undefined,
    enhancedAt: new Date().toISOString(),
    isEnhanced: true,
  };
}

/**
 * Apply fallback strategy for missing category data
 * @purpose Create comprehensive fallback category when original data is unavailable
 * @param {string} categoryId - Category ID for fallback creation
 * @param {Object} [options={}] - Fallback strategy options
 * @returns {Object} Complete fallback category data
 * @usedBy validateAndApplyFallbacks
 */
function applyFallbackCategoryStrategy(categoryId, options = {}) {
  const fallbackStrategy = options.fallbackStrategy || 'basic';

  const baseCategory = {
    id: categoryId,
    name: `Category ${categoryId}`,
    parent_id: null,
    level: 0,
    is_active: true,
    path: `1/${categoryId}`,
    isFallback: true,
    fallbackStrategy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (fallbackStrategy === 'enhanced') {
    return {
      ...baseCategory,
      description: `Fallback category for ID ${categoryId}`,
      url_key: `category-${categoryId}`,
      meta_title: `Category ${categoryId}`,
      meta_description: `Products in category ${categoryId}`,
    };
  }

  return baseCategory;
}

/**
 * Normalize category fields to standard format
 * @purpose Ensure category data conforms to expected structure and data types
 * @param {Object} category - Raw category data to normalize
 * @returns {Object} Normalized category data
 * @usedBy validateAndEnhanceCategoryData
 */
function normalizeCategoryFields(category) {
  return {
    id: category.id || 0,
    name: category.name || `Category ${category.id || 'Unknown'}`,
    parent_id: category.parent_id || null,
    level: category.level || 0,
    is_active: category.is_active !== undefined ? category.is_active : true,
    path: category.path || `1/${category.id || 0}`,
    isFallback: category.isFallback || false,
  };
}

/**
 * Generate validation metadata for category data
 * @purpose Create validation status information for category quality assessment
 * @param {Object} category - Category data to validate
 * @returns {Object} Validation metadata with quality indicators
 * @usedBy validateAndEnhanceCategoryData
 */
function generateCategoryValidationMetadata(category) {
  return {
    hasName: !!category.name,
    hasValidLevel: typeof category.level === 'number' && category.level >= 0,
    hasPath: !!category.path,
  };
}

module.exports = {
  // Workflows
  validateAndApplyFallbacks,

  // Utilities
  validateAndEnhanceCategoryData,
  applyFallbackCategoryStrategy,
  normalizeCategoryFields,
  generateCategoryValidationMetadata,
};
