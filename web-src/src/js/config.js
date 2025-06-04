/**
 * Frontend configuration
 * @module config
 */

import { urlConfig } from '../config/url';

// Helper to get runtime URL
function getRuntimeUrl(action) {
  const { baseUrl, namespace, package: pkg, version, paths } = urlConfig;

  // In development mode (localhost), namespace is not included in the URL path
  // In deployed environments, namespace is included
  const includeNamespace = !baseUrl.includes('localhost');

  if (includeNamespace) {
    // Production/staging: baseUrl/api/version/web/namespace/package/action
    return `${baseUrl}${paths.base}/${version}${paths.web}/${namespace}/${pkg}/${action}`;
  } else {
    // Development: baseUrl/api/version/web/package/action (no namespace)
    return `${baseUrl}${paths.base}/${version}${paths.web}/${pkg}/${action}`;
  }
}

// Runtime action URLs
export const actionUrls = Object.entries(urlConfig.actions).reduce((urls, [key, action]) => {
  urls[key] = getRuntimeUrl(action);
  return urls;
}, {});
