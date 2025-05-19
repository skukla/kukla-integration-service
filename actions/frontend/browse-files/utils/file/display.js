/**
 * Frontend file display utilities
 * @module utils/frontend/file/display
 */

const { formatFileSize } = require('../../../../shared/file/size');
const { removePublicPrefix, formatFileDate } = require('../../../../shared/file/format');

/**
 * Gets formatted file details for display in the UI
 * @param {Object} file - File object from Files SDK
 * @param {Object} props - File properties from Files SDK
 * @returns {Object} Formatted file details
 */
function getFileDisplayDetails(file, props) {
    const size = props.contentLength || props.size || 0;
    return {
        name: removePublicPrefix(file.name),
        fullPath: file.name,
        size: formatFileSize(Number(size)),
        lastModified: formatFileDate(props.lastModified)
    };
}

module.exports = {
    getFileDisplayDetails
}; 