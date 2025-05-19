/**
 * UI notification utilities for browse-files
 * @module ui-notifications
 */

/**
 * Creates an error notification element
 * @param {string} message - Error message to display
 * @returns {string} HTML for the error notification
 */
function createErrorNotification(message) {
    return `
        <div class="error-notification" role="alert">
            <p>${message}</p>
        </div>
    `;
}

module.exports = {
    createErrorNotification
}; 