/**
 * Products Image Utilities
 *
 * Low-level pure functions for image processing and URL generation.
 * Contains utilities for transforming Commerce media gallery data.
 */

/**
 * Transforms a media gallery entry into a simplified image object.
 * @param {Object} img - Media gallery entry from Adobe Commerce
 * @param {string} img.file - Image file path
 * @param {number} img.position - Image position/order
 * @param {Array<string>} [img.types] - Image type/role identifiers
 * @returns {Object} Simplified image object
 */
function transformImageEntry(img) {
  if (!img || typeof img !== 'object') {
    return {
      filename: '',
      url: '',
      position: 0,
      roles: [],
    };
  }

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
 * Validates an image object structure
 * Pure function that checks if an image object has required properties.
 *
 * @param {Object} image - Image object to validate
 * @returns {boolean} True if image is valid
 */
function validateImageObject(image) {
  if (!image || typeof image !== 'object') {
    return false;
  }

  // Required: filename or url
  if (!image.filename && !image.url) {
    return false;
  }

  // Position should be a number
  if (image.position !== undefined && typeof image.position !== 'number') {
    return false;
  }

  // Roles should be an array if present
  if (image.roles !== undefined && !Array.isArray(image.roles)) {
    return false;
  }

  return true;
}

/**
 * Filters images by role/type
 * Pure function that returns images matching specific roles.
 *
 * @param {Object[]} images - Array of image objects
 * @param {string[]} roles - Array of role names to filter by
 * @returns {Object[]} Filtered images array
 */
function filterImagesByRole(images, roles) {
  if (!Array.isArray(images) || !Array.isArray(roles)) {
    return [];
  }

  return images.filter((image) => {
    if (!image.roles || !Array.isArray(image.roles)) {
      return false;
    }
    return roles.some((role) => image.roles.includes(role));
  });
}

/**
 * Sorts images by position
 * Pure function that sorts images by their position property.
 *
 * @param {Object[]} images - Array of image objects
 * @param {string} [order='asc'] - Sort order ('asc' or 'desc')
 * @returns {Object[]} Sorted images array
 */
function sortImagesByPosition(images, order = 'asc') {
  if (!Array.isArray(images)) {
    return [];
  }

  const sortedImages = [...images];
  return sortedImages.sort((a, b) => {
    const posA = a.position || 0;
    const posB = b.position || 0;

    if (order === 'desc') {
      return posB - posA;
    }
    return posA - posB;
  });
}

/**
 * Generates thumbnail URL from image URL
 * Pure function that creates thumbnail URL by modifying the image path.
 *
 * @param {string} imageUrl - Original image URL
 * @param {string} [size='small'] - Thumbnail size ('small', 'medium', 'large')
 * @returns {string} Thumbnail URL
 */
function generateThumbnailUrl(imageUrl, size = 'small') {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // If it's already a thumbnail URL, return as-is
  if (imageUrl.includes('/cache/')) {
    return imageUrl;
  }

  // Insert cache/size into the path
  const sizeMap = {
    small: '75x75',
    medium: '150x150',
    large: '300x300',
  };

  const dimensions = sizeMap[size] || sizeMap.small;

  // Handle different URL formats
  if (imageUrl.startsWith('catalog/product/')) {
    return `catalog/product/cache/${dimensions}${imageUrl.substring('catalog/product'.length)}`;
  }

  return imageUrl; // Return original if format is unknown
}

module.exports = {
  transformImageEntry,
  getPrimaryImageUrl,
  validateImageObject,
  filterImagesByRole,
  sortImagesByPosition,
  generateThumbnailUrl,
};
