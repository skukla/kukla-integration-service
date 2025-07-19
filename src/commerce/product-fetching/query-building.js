/**
 * Product Fetching - Query Building Sub-module
 * All query parameter building and formatting utilities
 */

// Query Building Workflows

/**
 * Build product query parameters
 * @purpose Create properly formatted Commerce API query from user input
 * @param {Object} query - Raw query parameters
 * @param {Object} config - Configuration object
 * @param {Object} options - Query building options
 * @returns {Object} Formatted Commerce API query parameters
 * @usedBy fetchProductsWithPagination
 */
function buildProductQuery(query, config, options = {}) {
  const searchCriteria = buildBasePaginationCriteria(query, config);

  addSortingToQuery(query, searchCriteria);
  addSearchTermToQuery(query, searchCriteria);
  addFieldFilteringToQuery(query, options, config, searchCriteria);

  return searchCriteria;
}

/**
 * Build basic product query
 * @purpose Create simple Commerce API query for basic fetching
 * @param {Object} query - Basic query parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Basic Commerce API query
 * @usedBy fetchProducts
 */
function buildBasicProductQuery(query, config) {
  const pageSize = query.limit || config.commerce.product.pagination.pageSize || 100;
  const currentPage = Math.floor((query.offset || 0) / pageSize) + 1;

  return {
    'searchCriteria[pageSize]': pageSize,
    'searchCriteria[currentPage]': currentPage,
  };
}

// Feature Utilities

/**
 * Build base pagination criteria
 * @purpose Create foundation search criteria with pagination parameters
 * @param {Object} query - Raw query parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Base search criteria with pagination
 */
function buildBasePaginationCriteria(query, config) {
  const defaultPageSize = config.commerce.product.pagination.pageSize;
  const maxPageSize = config.commerce.product.pagination.maxPageSize;

  return {
    'searchCriteria[pageSize]': Math.min(query.pageSize || defaultPageSize, maxPageSize),
    'searchCriteria[currentPage]': query.currentPage || 1,
  };
}

/**
 * Add sorting parameters to query
 * @purpose Apply sort order parameters to Commerce API search criteria
 * @param {Object} query - Raw query parameters
 * @param {Object} searchCriteria - Search criteria to modify
 */
function addSortingToQuery(query, searchCriteria) {
  if (query.sortBy) {
    searchCriteria['searchCriteria[sortOrders][0][field]'] = query.sortBy;
    searchCriteria['searchCriteria[sortOrders][0][direction]'] = query.sortDirection || 'ASC';
  }
}

/**
 * Add search term parameters to query
 * @purpose Apply text search filtering to Commerce API search criteria
 * @param {Object} query - Raw query parameters
 * @param {Object} searchCriteria - Search criteria to modify
 */
function addSearchTermToQuery(query, searchCriteria) {
  if (query.searchTerm) {
    searchCriteria['searchCriteria[filter_groups][0][filters][0][field]'] = 'name';
    searchCriteria['searchCriteria[filter_groups][0][filters][0][value]'] = `%${query.searchTerm}%`;
    searchCriteria['searchCriteria[filter_groups][0][filters][0][condition_type]'] = 'like';
  }
}

/**
 * Add field filtering parameters to query
 * @purpose Apply field selection to Commerce API query for optimized responses
 * @param {Object} query - Raw query parameters
 * @param {Object} options - Query building options
 * @param {Object} config - Configuration object
 * @param {Object} searchCriteria - Search criteria to modify
 */
function addFieldFilteringToQuery(query, options, config, searchCriteria) {
  if (query.fields || options.fields) {
    const requestedFields = query.fields || options.fields || config.commerce.product.fields;
    if (Array.isArray(requestedFields)) {
      searchCriteria.fields = requestedFields.join(',');
    }
  }
}

/**
 * Build criteria-based query
 * @purpose Create targeted query for specific search criteria
 * @param {Object} criteria - Specific search criteria
 * @param {Object} config - Configuration object
 * @returns {Object} Criteria-based Commerce API query
 * @usedBy fetchProductsByCriteria
 */
function buildCriteriaQuery(criteria, config) {
  const query = {
    'searchCriteria[pageSize]': config.commerce.product.pagination.pageSize,
    'searchCriteria[currentPage]': 1,
  };

  let filterIndex = 0;

  // Add SKU filters
  if (criteria.skus && Array.isArray(criteria.skus)) {
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][field]`] = 'sku';
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][value]`] =
      criteria.skus.join(',');
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]`] = 'in';
    filterIndex++;
  }

  // Add category filters
  if (criteria.categoryIds && Array.isArray(criteria.categoryIds)) {
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][field]`] = 'category_id';
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][value]`] =
      criteria.categoryIds.join(',');
    query[`searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]`] = 'in';
    filterIndex++;
  }

  // Add attribute filters
  if (criteria.attributeFilters && Array.isArray(criteria.attributeFilters)) {
    criteria.attributeFilters.forEach((filter) => {
      query[`searchCriteria[filter_groups][${filterIndex}][filters][0][field]`] = filter.field;
      query[`searchCriteria[filter_groups][${filterIndex}][filters][0][value]`] = filter.value;
      query[`searchCriteria[filter_groups][${filterIndex}][filters][0][condition_type]`] =
        filter.condition || 'eq';
      filterIndex++;
    });
  }

  return query;
}

module.exports = {
  buildProductQuery,
  buildBasicProductQuery,
  buildCriteriaQuery,
};
