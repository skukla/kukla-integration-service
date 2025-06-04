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
      const testUrl = `${urlConfig.baseUrl}/api/v1/web/kukla-integration-service/browse-files`;
      await fetch(testUrl, { method: 'HEAD' });
    } catch (error) {
      const isSSLError =
        error.message.includes('ERR_CERT_AUTHORITY_INVALID') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_SSL_PROTOCOL_ERROR') ||
        error.message.includes('Failed to fetch');

      if (isSSLError) {
        console.warn('🔒 SSL Certificate Issue Detected');
        console.warn('📋 To fix this, please:');
        console.warn('   1. Open this link in a new tab:');
        console.warn(
          `      ${urlConfig.baseUrl}/api/v1/web/kukla-integration-service/browse-files`
        );
        console.warn('   2. Accept the security warning ("Advanced" → "Proceed to localhost")');
        console.warn('   3. Reload this page');

        // Show user-friendly notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 10000;
          background: #ff4444; color: white; padding: 16px; border-radius: 8px;
          max-width: 400px; font-family: Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">🔒 SSL Certificate Required</div>
          <div style="margin-bottom: 12px;">Please accept the self-signed certificate:</div>
          <a href="${urlConfig.baseUrl}/api/v1/web/kukla-integration-service/browse-files" 
             target="_blank" 
             style="color: #ffcccc; text-decoration: underline; font-weight: bold;">
            Click here to accept certificate →
          </a>
          <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">Then reload this page</div>
          <button onclick="this.parentElement.remove()" 
                  style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
        `;
        document.body.appendChild(notification);

        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 30000);
      }
    }
  }
}
