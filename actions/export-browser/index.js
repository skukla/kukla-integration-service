/**
 * Export browser action for managing product export files
 * @module export-browser
 */

const { Core, Files: FilesLib } = require('@adobe/aio-sdk');
const { htmlResponse, errorResponse } = require('./htmx-utils');

/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generates HTML for the delete confirmation modal
 * @param {string} fileName - Name of the file to delete
 * @param {string} fullPath - Full path of the file
 * @returns {string} HTML for the modal
 */
function getDeleteModalHtml(fileName, fullPath) {
    return `
        <div class="modal-content">
            <h2>Delete File</h2>
            <div class="modal-body">
                <p>Are you sure you want to delete "${fileName}"?</p>
                <p class="modal-warning">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <div class="btn-group">
                    <button type="button"
                            class="btn btn-secondary"
                            hx-get="https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/export-browser"
                            hx-target="#modal-backdrop"
                            hx-swap="outerHTML"
                            aria-label="Cancel deletion">
                        <span class="btn-label">Cancel</span>
                    </button>
                    <button type="button"
                            class="btn btn-danger btn-outline"
                            hx-delete="https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/delete-file?fileName=${encodeURIComponent(fullPath)}"
                            hx-target="closest .table-row"
                            hx-swap="outerHTML swap:1s"
                            aria-label="Confirm deletion of ${fileName}">
                        <span class="btn-label">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Main function that handles file browsing and management
 * @param {Object} params - Action parameters
 * @param {string} [params.LOG_LEVEL='info'] - Logging level
 * @returns {Promise<Object>} Action response
 */
async function main(params) {
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        logger.info('Initializing Files SDK');
        const files = await FilesLib.init();
        
        // Handle different HTTP methods
        switch (params.__ow_method) {
            case 'get':
                try {
                    // If modal parameter is present, return modal HTML
                    if (params.modal === 'delete' && params.fileName) {
                        return htmlResponse(getDeleteModalHtml(
                            params.fileName,
                            params.fullPath
                        ));
                    }

                    logger.info('Listing files from public directory');
                    const filesList = await files.list('public');
                    logger.info(`Found ${filesList.length} total files`);
                    
                    // Filter for CSV files and get their details
                    const csvFiles = filesList.filter(file => file.name.endsWith('.csv'));
                    logger.info(`Found ${csvFiles.length} CSV files`);
                    
                    const fileDetails = await Promise.all(
                        csvFiles.map(async file => {
                            logger.info(`Getting properties for file: ${file.name}`);
                            const props = await files.getProperties(file.name);
                            logger.info('File properties:', JSON.stringify(props, null, 2));
                            const displayName = file.name.replace('public/', '');
                            const size = props.contentLength || props.size || 0;
                            logger.info(`File size for ${displayName}: ${size} bytes`);
                            return {
                                name: displayName,
                                fullPath: file.name,
                                size: formatFileSize(Number(size)),
                                lastModified: new Date(props.lastModified).toLocaleString()
                            };
                        })
                    );

                    if (fileDetails.length === 0) {
                        return htmlResponse(`
                            <div class="empty-state">
                                <h2>No Files Found</h2>
                                <p>There are no exported files to display.</p>
                            </div>
                        `);
                    }

                    // Return HTML list items for HTMX to inject
                    const items = fileDetails.map(file => `
                        <div class="table-row">
                            <div class="table-cell">
                                <span>${file.name}</span>
                            </div>
                            <div class="table-cell">
                                <span>${file.size}</span>
                            </div>
                            <div class="table-cell">
                                <span>${file.lastModified}</span>
                            </div>
                            <div class="table-cell">
                                <div class="actions-container">
                                    <div class="btn-group">
                                        <button type="button" 
                                                class="btn btn-primary"
                                                hx-get="${encodeURIComponent(`https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/download-file?fileName=${file.fullPath}`)}"
                                                hx-swap="none"
                                                aria-label="Download ${file.name}">
                                            <span class="btn-label">Download</span>
                                        </button>
                                        <button type="button"
                                                class="btn btn-danger btn-outline"
                                                hx-get="${encodeURIComponent(`https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service/export-browser?modal=delete&fileName=${file.name}&fullPath=${file.fullPath}`)}"
                                                hx-target="#modal-container"
                                                hx-swap="innerHTML"
                                                aria-label="Delete ${file.name}">
                                            <span class="btn-label">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');

                    // Return the file list
                    return htmlResponse(items);
                } catch (error) {
                    logger.error('Error listing files:', error);
                    return errorResponse(`Failed to list files: ${error.message}`, 500);
                }

            case 'delete':
                try {
                    const fileName = params.fileName;
                    if (!fileName) {
                        return errorResponse('File name is required', 400);
                    }

                    logger.info(`Deleting file: ${fileName}`);
                    await files.delete(fileName);
                    return htmlResponse('', 200);
                } catch (error) {
                    logger.error('Error deleting file:', error);
                    return errorResponse(`Failed to delete file: ${error.message}`, 500);
                }

            default:
                return errorResponse('Method not allowed', 405);
        }
    } catch (error) {
        logger.error('Error in export-browser action:', error);
        return errorResponse(`Failed to initialize file system: ${error.message}`, 500);
    }
}

module.exports = {
    main
}; 