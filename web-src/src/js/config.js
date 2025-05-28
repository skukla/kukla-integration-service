/**
 * Frontend configuration
 * @module config
 */

// Import runtime configuration
import runtimeConfig from '../config.json';
import { url as urlConfig } from '../../../config/defaults/url.defaults.js';

// Export the main URL configuration
export const config = { url: urlConfig };

// Helper to get runtime URL with fallback
function getRuntimeUrl(action) {
    const key = `${urlConfig.runtime.package}/${action}`;
    const url = runtimeConfig[key];
    
    if (!url && process.env.NODE_ENV === 'development') {
        // In development, construct a default local URL
        const { baseUrl, paths, version, namespace, package: pkg } = urlConfig.runtime;
        return `${baseUrl}${paths.base}/${version}${paths.web}/${namespace}/${pkg}/${action}`;
    }
    
    return url;
}

// Runtime action URLs (provided by App Builder at runtime)
export const actionUrls = Object.entries(urlConfig.runtime.actions).reduce((urls, [key, action]) => {
    urls[key] = getRuntimeUrl(action);
    return urls;
}, {}); 