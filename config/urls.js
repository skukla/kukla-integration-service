/**
 * URL configuration for different environments
 * @module config/urls
 */

const ENV_URLS = {
    dev: 'http://localhost:3000',
    stage: 'https://285361-188maroonwallaby-stage.adobeio-static.net/api/v1/web/kukla-integration-service',
    prod: 'https://285361-188maroonwallaby-prod.adobeio-static.net/api/v1/web/kukla-integration-service'
};

/**
 * Get base URL for environment
 * @param {string} env - Environment name (dev, stage, prod)
 * @returns {string} Base URL for the environment
 */
function getBaseUrl(env) {
    const url = ENV_URLS[env];
    if (!url) {
        throw new Error(`Invalid environment: ${env}`);
    }
    return url;
}

module.exports = {
    getBaseUrl,
    ENV_URLS
}; 