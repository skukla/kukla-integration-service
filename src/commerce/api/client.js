/**
 * Adobe Commerce API client
 * @module commerce/api/client
 */

const { 
    http: { addCompression },
    monitoring: { createErrorResponse },
    storage: { HttpCache }
} = require('../../core');
const { COMMERCE_CONFIG } = require('./config');

/**
 * Process Commerce API response with caching and compression
 * @param {Response} response - Fetch response
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} Processed response
 * @throws {Error} Formatted error response
 */
async function processResponse(response, context = {}) {
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
        const cachedResponse = HttpCache.addHeaders(baseResponse, {
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
async function makeRequest(url, options = {}, context = {}) {
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

            const result = await processResponse(response, {
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
 * Batches multiple Commerce API requests
 * @param {Array<Object>} requests - Array of request objects
 * @returns {Promise<Array>} Array of responses
 */
async function batchRequests(requests) {
    const results = [];
    // Process requests in batches
    for (let i = 0; i < requests.length; i += COMMERCE_CONFIG.BATCH_SIZE) {
        const batch = requests.slice(i, i + COMMERCE_CONFIG.BATCH_SIZE);
        const batchPromises = batch.map(req => 
            makeRequest(req.url, req.options, req.context)
        );
        // Wait for all requests in this batch
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
    }
    return results;
}

module.exports = {
    makeRequest,
    batchRequests,
    processResponse
}; 