/**
 * File Browser - Metadata Processing Sub-module
 * All metadata enrichment and processing utilities
 */

// Metadata Processing Workflows

/**
 * Enrich files with additional metadata
 * @purpose Add detailed metadata to file objects for enhanced display
 * @param {Array} files - Array of basic file objects
 * @param {Object} config - Configuration object
 * @param {Object} params - Action parameters
 * @returns {Promise<Array>} Array of files with enriched metadata
 * @usedBy browseCsvFilesWithMetadata
 */
async function enrichFilesWithMetadata(files, config, params) {
  const { initializeStorageStrategy } = require('../shared/storage-strategies');

  const storage = await initializeStorageStrategy(config, params);
  const enrichmentPromises = files.map((file) => enrichSingleFileMetadata(storage, file, config));

  const enrichedFiles = await Promise.all(enrichmentPromises);
  return enrichedFiles.filter((file) => file !== null); // Remove failed enrichments
}

/**
 * Validate browser results
 * @purpose Validate and ensure consistency of browser results
 * @param {Array} files - Array of file objects to validate
 * @returns {Array} Validated array of file objects
 * @usedBy browseCsvFilesWithMetadata, browseCsvFiles
 */
function validateBrowserResults(files) {
  if (!Array.isArray(files)) {
    throw new Error('Browser results must be an array');
  }

  return files.filter((file) => {
    if (!file || typeof file !== 'object') {
      console.warn('Invalid file object found in browser results:', file);
      return false;
    }

    if (!file.name || typeof file.name !== 'string') {
      console.warn('File object missing valid name:', file);
      return false;
    }

    return true;
  });
}

// Metadata Processing Utilities

/**
 * Enrich single file with additional metadata
 * @purpose Add detailed metadata to a single file object
 * @param {Object} storage - Storage wrapper instance
 * @param {Object} file - Basic file object
 * @param {Object} config - Configuration object
 * @returns {Promise<Object|null>} Enriched file object or null if failed
 * @usedBy enrichFilesWithMetadata
 */
async function enrichSingleFileMetadata(storage, file, config) {
  try {
    const { getFileMetadataForFile } = require('./storage-operations');

    const detailedMetadata = await getFileMetadataForFile(storage, file.name, config);
    if (!detailedMetadata) return file; // Return original if enrichment fails

    return {
      ...file,
      ...detailedMetadata,
      enriched: true,
      enrichmentTimestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`Failed to enrich metadata for file ${file.name}:`, error.message);
    return file; // Return original file if enrichment fails
  }
}

/**
 * Calculate file statistics
 * @purpose Calculate aggregate statistics for file collection
 * @param {Array} files - Array of file objects
 * @returns {Object} File statistics object
 * @usedBy Browser statistics and reporting
 */
function calculateFileStatistics(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return {
      totalFiles: 0,
      totalSize: 0,
      averageSize: 0,
      oldestFile: null,
      newestFile: null,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + (file.rawSize || 0), 0);
  const averageSize = totalSize / files.length;

  // Find oldest and newest files
  const sortedByDate = files
    .filter((file) => file.lastModifiedRaw)
    .sort((a, b) => new Date(a.lastModifiedRaw) - new Date(b.lastModifiedRaw));

  const oldestFile = sortedByDate[0] || null;
  const newestFile = sortedByDate[sortedByDate.length - 1] || null;

  return {
    totalFiles: files.length,
    totalSize,
    averageSize,
    oldestFile: oldestFile ? oldestFile.name : null,
    newestFile: newestFile ? newestFile.name : null,
  };
}

/**
 * Group files by date range
 * @purpose Group files by time periods for organized display
 * @param {Array} files - Array of file objects
 * @param {string} [groupBy='day'] - Grouping period ('day', 'week', 'month')
 * @returns {Object} Files grouped by date ranges
 * @usedBy File organization and display
 */
function groupFilesByDate(files, groupBy = 'day') {
  const groups = {};

  files.forEach((file) => {
    if (!file.lastModifiedRaw) return;

    const date = new Date(file.lastModifiedRaw);
    let groupKey;

    switch (groupBy) {
      case 'day':
        groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        groupKey = 'unknown';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(file);
  });

  return groups;
}

module.exports = {
  // Workflows
  enrichFilesWithMetadata,
  validateBrowserResults,

  // Utilities
  enrichSingleFileMetadata,
  calculateFileStatistics,
  groupFilesByDate,
};
