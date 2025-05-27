/**
 * CSV storage step for product export
 * @module steps/storeCsv
 */

const { 
    storage: { files },
    config: { storage: { buildApiUrl, STORAGE_CONFIG } }
} = require('../../../../src/core');
const { Files: FilesLib } = require('@adobe/aio-sdk');

/**
 * Builds a download URL for a file
 * @param {string} fileName - Name of the file
 * @returns {string} Download URL
 */
function buildDownloadUrl(fileName) {
    return buildApiUrl({
        org: 'adobe-demo-org',
        service: 'kukla-integration-service',
        action: 'download-file',
        params: { fileName }
    });
}

/**
 * Stores a CSV file in the configured storage location
 * @param {Object} csvResult - CSV generation result
 * @param {Buffer} csvResult.content - CSV content to store
 * @param {Object} csvResult.stats - Compression statistics
 * @returns {Promise<Object>} Storage result with file information
 */
async function storeCsv(csvResult) {
    const fileName = 'products.csv';
    const publicFileName = `${STORAGE_CONFIG.FILES.PUBLIC_DIR}/${fileName}`;
    
    // Initialize Files SDK
    const filesLib = await FilesLib.init();
    
    // Store the file using core file operations
    await files.writeFile(filesLib, publicFileName, csvResult.content);
    
    // Get file properties to verify storage
    const properties = await files.getFileProperties(filesLib, publicFileName);
    
    return {
        fileName: publicFileName,
        downloadUrl: buildDownloadUrl(publicFileName),
        properties
    };
}

module.exports = storeCsv; 