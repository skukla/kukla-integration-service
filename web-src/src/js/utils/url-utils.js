import API_ENDPOINTS from '../config/api.js';

/**
 * Gets the full URL for an action endpoint with optional query parameters
 * @param {string} endpoint - The endpoint key from API_ENDPOINTS
 * @param {Object} [params] - Optional query parameters
 * @returns {string} The full URL with encoded query parameters
 */
export function getActionUrl(endpoint, params = {}) {
    const baseUrl = API_ENDPOINTS[endpoint];
    if (!baseUrl) {
        console.error(`Unknown endpoint: ${endpoint}`);
        return '';
    }

    const queryParams = new URLSearchParams(params).toString();
    return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
}

/**
 * Encodes a URL with query parameters
 * @param {string} url - The URL to encode
 * @returns {string} The encoded URL
 */
export function encodeActionUrl(url) {
    return encodeURIComponent(url);
} 