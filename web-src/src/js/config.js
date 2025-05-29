/**
 * Frontend configuration
 * @module config
 */

import { urlConfig } from '../config/url';

// Helper to get runtime URL
function getRuntimeUrl(action) {
  const { baseUrl, port, paths, version, namespace, package: pkg } = urlConfig;
  return `${baseUrl}:${port}${paths.base}/${version}${paths.web}/${namespace}/${pkg}/${action}`;
}

// Runtime action URLs
export const actionUrls = Object.entries(urlConfig.actions).reduce((urls, [key, action]) => {
  urls[key] = getRuntimeUrl(action);
  return urls;
}, {});
