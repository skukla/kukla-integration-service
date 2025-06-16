/**
 * CSV storage step for product export - Multi-Provider Implementation
 * @module steps/storeCsv
 */
const { loadConfig } = require('../../../../config');
const { initializeStorage } = require('../../../../src/core/storage');

/**
 * Stores a CSV file using the configured storage provider
 * @param {Object|string} csvResult - CSV generation result or simple string content
 * @param {Object} params - Action parameters containing credentials
 * @returns {Promise<Object>} Storage result with file information
 */
async function storeCsv(csvResult, params = {}) {
  // Handle both complex CSV result object and simple string content
  const content = typeof csvResult === 'string' ? csvResult : csvResult.content;
  const stats = typeof csvResult === 'object' && csvResult.stats ? csvResult.stats : null;

  // Load configuration with params for proper environment detection
  const config = loadConfig(params);
  const fileName = config.storage.csv.filename;
  const timestamp = new Date().toISOString();

  try {
    // Initialize storage provider with params
    const storage = await initializeStorage(params);

    // Store the file (overwrites existing file)
    const result = await storage.write(fileName, content);

    const response = {
      fileName: result.fileName,
      location: result.fileName,
      downloadUrl: result.url,
      properties: {
        name: fileName,
        size: `${content.length} bytes`,
        lastModified: result.properties?.lastModified || timestamp,
        contentType: 'text/csv',
        ...result.properties,
      },
      stored: true,
      timestamp,
      storageType: storage.provider,
      overwritten: true,
    };

    // Add compression stats if available
    if (stats) {
      response.compressionStats = stats;
    }

    return response;
  } catch (error) {
    // Return error response without storage fallback
    return {
      fileName,
      downloadUrl: null,
      properties: {
        name: fileName,
        size: `${content.length} bytes`,
        lastModified: timestamp,
        contentType: 'text/csv',
      },
      stored: false,
      timestamp,
      storageType: 'error',
      overwritten: false,
      compressionStats: stats,
      error: {
        message: error.message,
        type: 'storage-failed',
      },
    };
  }
}

module.exports = storeCsv;
