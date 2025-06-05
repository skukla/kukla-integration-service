/**
 * Frontend configuration
 * @module config
 */

import { urlConfig } from '../config/url';

// Helper to get runtime URL
function getRuntimeUrl(action) {
  const { baseUrl, namespace, package: pkg, version, paths } = urlConfig;

  // For Adobe I/O static hosting (adobeio-static.net), namespace is part of the domain, not the path
  // Only include namespace in path for direct runtime domains (adobeioruntime.net)
  const includeNamespace = baseUrl.includes('adobeioruntime.net');

  if (includeNamespace) {
    // Direct runtime domain: baseUrl/api/version/web/namespace/package/action
    return `${baseUrl}${paths.base}/${version}${paths.web}/${namespace}/${pkg}/${action}`;
  } else {
    // Static hosting or development: baseUrl/api/version/web/package/action (no namespace in path)
    return `${baseUrl}${paths.base}/${version}${paths.web}/${pkg}/${action}`;
  }
}

// Runtime action URLs
export const actionUrls = Object.entries(urlConfig.actions).reduce((urls, [key, action]) => {
  urls[key] = getRuntimeUrl(action);
  return urls;
}, {});

// Check if we can reach the backend and provide guidance if needed
export async function checkBackendConnection() {
  if (urlConfig.baseUrl.includes('localhost') && urlConfig.baseUrl.startsWith('https://')) {
    try {
      const testUrl = getRuntimeUrl('browse-files');
      await fetch(testUrl, { method: 'HEAD' });
    } catch (error) {
      // In production, we don't need to show development SSL warnings
      // Just silently handle the connection check
    }
  }
}
