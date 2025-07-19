/**
 * File Browser - Sorting and Filtering Sub-module
 * All file sorting, filtering, and result processing utilities
 */

// Sorting and Filtering Workflows

/**
 * Process browser files with sorting and filtering
 * @purpose Apply comprehensive processing to file collection
 * @param {Array} files - Array of file objects to process
 * @param {Object} [options={}] - Processing options
 * @returns {Array} Processed array of file objects
 * @usedBy browseCsvFilesWithMetadata, browseCsvFiles
 */
function processBrowserFiles(files, options = {}) {
  let processedFiles = [...files]; // Create copy to avoid mutation

  // Apply filtering if specified
  if (options.filter) {
    processedFiles = applyFileFilter(processedFiles, options.filter);
  }

  // Apply sorting
  const sortBy = options.sortBy || 'lastModified';
  const sortOrder = options.sortOrder || 'desc';
  processedFiles = sortFiles(processedFiles, sortBy, sortOrder);

  // Apply pagination if specified
  if (options.limit) {
    processedFiles = processedFiles.slice(0, options.limit);
  }

  return processedFiles;
}

/**
 * Sort files by date (specialized sorting function)
 * @purpose Sort files by last modified date with consistent handling
 * @param {Array} files - Array of file objects
 * @param {string} [order='desc'] - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array of files
 * @usedBy browseCsvFiles, sortFiles
 */
function sortFilesByDate(files, order = 'desc') {
  return files.sort((a, b) => {
    const dateA = new Date(a.lastModifiedRaw || a.lastModified || 0);
    const dateB = new Date(b.lastModifiedRaw || b.lastModified || 0);

    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// Sorting and Filtering Utilities

/**
 * Sort files by specified field
 * @purpose Generic file sorting with multiple field support
 * @param {Array} files - Array of file objects to sort
 * @param {string} sortBy - Field to sort by ('name', 'size', 'lastModified')
 * @param {string} [order='asc'] - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array of files
 * @usedBy processBrowserFiles
 */
function sortFiles(files, sortBy, order = 'asc') {
  return files.sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'name':
        valueA = (a.name || '').toLowerCase();
        valueB = (b.name || '').toLowerCase();
        break;
      case 'size':
        valueA = a.rawSize || 0;
        valueB = b.rawSize || 0;
        break;
      case 'lastModified':
        valueA = new Date(a.lastModifiedRaw || a.lastModified || 0);
        valueB = new Date(b.lastModifiedRaw || b.lastModified || 0);
        break;
      default:
        valueA = a[sortBy] || '';
        valueB = b[sortBy] || '';
    }

    // Handle comparison based on data type
    if (valueA instanceof Date && valueB instanceof Date) {
      return order === 'desc' ? valueB - valueA : valueA - valueB;
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return order === 'desc' ? valueB - valueA : valueA - valueB;
    }

    // String comparison
    const compareResult = String(valueA).localeCompare(String(valueB));
    return order === 'desc' ? -compareResult : compareResult;
  });
}

/**
 * Apply filter to file collection
 * @purpose Filter files based on various criteria
 * @param {Array} files - Array of file objects to filter
 * @param {Object} filter - Filter criteria object
 * @returns {Array} Filtered array of files
 * @usedBy processBrowserFiles
 */
function applyFileFilter(files, filter) {
  return files.filter((file) => {
    // Filter by name pattern
    if (filter.namePattern) {
      const pattern = new RegExp(filter.namePattern, 'i');
      if (!pattern.test(file.name)) return false;
    }

    // Filter by minimum size
    if (filter.minSize && (file.rawSize || 0) < filter.minSize) {
      return false;
    }

    // Filter by maximum size
    if (filter.maxSize && (file.rawSize || 0) > filter.maxSize) {
      return false;
    }

    // Filter by date range
    if (filter.dateFrom || filter.dateTo) {
      const fileDate = new Date(file.lastModifiedRaw || file.lastModified);

      if (filter.dateFrom && fileDate < new Date(filter.dateFrom)) {
        return false;
      }

      if (filter.dateTo && fileDate > new Date(filter.dateTo)) {
        return false;
      }
    }

    // Filter by file extension
    if (filter.extensions && Array.isArray(filter.extensions)) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!filter.extensions.includes(fileExtension)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Search files by text query
 * @purpose Search files by name and metadata with text matching
 * @param {Array} files - Array of file objects to search
 * @param {string} query - Search query string
 * @param {Object} [options={}] - Search options
 * @returns {Array} Filtered array of matching files
 * @usedBy Advanced file search operations
 */
function searchFiles(files, query, options = {}) {
  if (!query || typeof query !== 'string') {
    return files;
  }

  const searchTerm = query.toLowerCase().trim();
  const caseSensitive = options.caseSensitive || false;
  const searchFields = options.fields || ['name'];

  return files.filter((file) => {
    return searchFields.some((field) => {
      const fieldValue = file[field];
      if (!fieldValue) return false;

      const searchValue = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase();
      const searchQuery = caseSensitive ? query : searchTerm;

      return searchValue.includes(searchQuery);
    });
  });
}

/**
 * Group files by size ranges
 * @purpose Group files into size categories for organized display
 * @param {Array} files - Array of file objects
 * @returns {Object} Files grouped by size ranges
 * @usedBy File organization and analysis
 */
function groupFilesBySize(files) {
  const groups = {
    small: [], // < 1MB
    medium: [], // 1MB - 10MB
    large: [], // 10MB - 100MB
    huge: [], // > 100MB
  };

  files.forEach((file) => {
    const size = file.rawSize || 0;
    const sizeInMB = size / (1024 * 1024);

    if (sizeInMB < 1) {
      groups.small.push(file);
    } else if (sizeInMB < 10) {
      groups.medium.push(file);
    } else if (sizeInMB < 100) {
      groups.large.push(file);
    } else {
      groups.huge.push(file);
    }
  });

  return groups;
}

module.exports = {
  // Workflows (used by feature core)
  processBrowserFiles,
  sortFilesByDate,

  // Utilities (available for testing/extension)
  sortFiles,
  applyFileFilter,
  searchFiles,
  groupFilesBySize,
};
