/**
 * Adobe Commerce integration utilities
 * @module actions/commerce/integration
 */
const fetch = require('node-fetch');
const { buildHeaders } = require('../core/http');
const { createErrorResponse } = require('../core/error-handler');
const { addCacheHeaders } = require('../core/cache');
const { addCompression } = require('../core/compression');
// Configuration
const COMMERCE_CONFIG = {
    REQUEST_TIMEOUT: 30000,    // 30 second timeout
    RETRY_ATTEMPTS: 3,         // Number of retry attempts
    RETRY_DELAY: 1000,        // Base delay between retries (ms)
    BATCH_SIZE: 50,           // Maximum items per batch
    CACHE_DURATION: 300       // Cache duration for GET requests (5 minutes)
};
/**
 * Process Commerce API response with caching and compression
 * @param {Response} response - Fetch response
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Processed response
 * @throws {Error} Formatted error response
 */
async function processCommerceResponse(response, context = {}) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const body = isJson ? await response.json() : await response.text();
    if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || 60;
            return createErrorResponse('COMMERCE_RATE_LIMIT', 'Too many requests to Commerce API', {
                ...context,
                retryAfter,
                headers: Object.fromEntries(response.headers)
            });
        }
        // Handle authentication errors
        if (response.status === 401) {
            return createErrorResponse('COMMERCE_AUTH', 'Commerce authentication failed', {
                ...context,
                response: body
            });
        }
        // Handle other errors
        return createErrorResponse('COMMERCE_API', 
            isJson && body.message ? body.message : 'Commerce API request failed',
            {
                ...context,
                status: response.status,
                response: body
            }
        );
    }
    // For GET requests, add caching headers
    const baseResponse = {
        statusCode: response.status,
        headers: {
            'Content-Type': contentType
        },
        body
    };
    if (context.method === 'GET') {
        const cachedResponse = addCacheHeaders(baseResponse, {
            maxAge: COMMERCE_CONFIG.CACHE_DURATION,
            public: false
        });
        return addCompression(cachedResponse, context.compression || {});
    }
    return baseResponse;
}
/**
 * Makes a Commerce API request with timeout and retry support
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Response data
 */
async function makeCommerceRequest(url, options = {}, context = {}) {
    let attempt = 0;
    
    while (attempt < COMMERCE_CONFIG.RETRY_ATTEMPTS) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => {
                controller.abort();
            }, COMMERCE_CONFIG.REQUEST_TIMEOUT);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeout);

            const result = await processCommerceResponse(response, {
                ...context,
                method: options.method || 'GET'
            });

            return result;

        } catch (error) {
            attempt++;
            
            // If we've exhausted all retries, throw the error
            if (attempt >= COMMERCE_CONFIG.RETRY_ATTEMPTS) {
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = COMMERCE_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
/**
 * Validates admin credentials against Adobe Commerce
 * @param {Object} params - Authentication parameters
 * @param {string} params.url - Commerce instance URL
 * @param {string} params.username - Admin username
 * @param {string} params.password - Admin password
 * @returns {Promise<Object>} Validation result
 */
async function validateAdminCredentials(params) {
    try {
        const url = `${params.url}/rest/V1/integration/admin/token`;
        return makeCommerceRequest(url, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({
                username: params.username,
                password: params.password
            })
        }, {
            url,
            username: params.username
        });
    } catch (error) {
        return createErrorResponse('COMMERCE_API', 
            'Failed to validate Commerce credentials',
            { originalError: error.message }
        );
    }
}
/**
 * Batches multiple Commerce API requests
 * @param {Array<Object>} requests - Array of request objects
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of responses
 */
async function batchRequests(requests, options = {}) {
    const results = [];
    // Process requests in batches
    for (let i = 0; i < requests.length; i += COMMERCE_CONFIG.BATCH_SIZE) {
        const batch = requests.slice(i, i + COMMERCE_CONFIG.BATCH_SIZE);
        const batchPromises = batch.map(req => 
            makeCommerceRequest(req.url, req.options, req.context)
        );
        // Wait for all requests in this batch
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
    }
    return results;
}
/**
 * Builds a Commerce API URL
 * @param {string} baseUrl - Base Commerce URL
 * @param {string} endpoint - API endpoint
 * @returns {string} Full URL
 */
function buildCommerceUrl(baseUrl, endpoint) {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}/rest${path}`;
}
module.exports = {
    COMMERCE_CONFIG,
    validateAdminCredentials,
    buildCommerceUrl,
    processCommerceResponse,
    makeCommerceRequest,
    batchRequests
}; 