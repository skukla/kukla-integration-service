/**
 * CSV storage step for product export
 * @module steps/storeCsv
 */

const { 
    storage: { files },
    config: { storage: storageConfig }
} = require('../../../../src/core');

/**
 * Stores a CSV file in the configured storage location
 * @param {Object} csvResult - CSV generation result
 * @param {Buffer} csvResult.content - CSV content to store
 * @param {Object} csvResult.stats - Compression statistics
 * @returns {Promise<Object>} Storage result with file information
 */
async function storeCsv(csvResult) {
    const fileName = 'products.csv';
    const publicFileName = `${storageConfig.files.publicDir}/${fileName}`;
    
    // Store the file using core file operations
    await files.writeFile(publicFileName, csvResult.content);
    
    // Get file properties to verify storage
    const properties = await files.getFileProperties(publicFileName);
    
    return {
        fileName: publicFileName,
        downloadUrl: files.buildDownloadUrl(publicFileName),
        properties
    };
}

module.exports = storeCsv; 