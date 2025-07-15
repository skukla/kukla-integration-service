/**
 * Products Sorting Operations
 *
 * Mid-level business logic for sorting product data.
 * Contains operations that handle product sorting and ordering requirements.
 */

/**
 * Sort products by SKU in ascending order
 * Business operation that sorts product array by SKU for consistent output.
 *
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<Object>} Sorted array of products
 */
function sortProductsBySku(products) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.sort((a, b) => {
    const skuA = a.sku || '';
    const skuB = b.sku || '';
    return skuA.localeCompare(skuB);
  });
}

/**
 * Sort products by name in ascending order
 * Business operation that sorts product array by name.
 *
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<Object>} Sorted array of products
 */
function sortProductsByName(products) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sort products by price in ascending order
 * Business operation that sorts product array by price.
 *
 * @param {Array<Object>} products - Array of product objects
 * @returns {Array<Object>} Sorted array of products
 */
function sortProductsByPrice(products) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    return priceA - priceB;
  });
}

/**
 * Sort products by specified field
 * Business operation that sorts product array by any field.
 *
 * @param {Array<Object>} products - Array of product objects
 * @param {string} field - Field to sort by
 * @param {string} [order='asc'] - Sort order ('asc' or 'desc')
 * @returns {Array<Object>} Sorted array of products
 */
function sortProductsByField(products, field, order = 'asc') {
  if (!Array.isArray(products)) {
    return products;
  }

  const sortedProducts = products.sort((a, b) => {
    const valueA = a[field] || '';
    const valueB = b[field] || '';

    // Handle numeric values
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return order === 'asc' ? valueA - valueB : valueB - valueA;
    }

    // Handle string values
    const comparison = valueA.toString().localeCompare(valueB.toString());
    return order === 'asc' ? comparison : -comparison;
  });

  return sortedProducts;
}

module.exports = {
  sortProductsBySku,
  sortProductsByName,
  sortProductsByPrice,
  sortProductsByField,
};
