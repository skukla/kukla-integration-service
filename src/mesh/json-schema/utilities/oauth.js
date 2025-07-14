/**
 * OAuth 1.0 Utilities for JSON Schema Resolvers
 * Extracted from monolithic resolver for reuse across source-specific resolvers
 */

/**
 * Percent encoding for OAuth (RFC 3986)
 */
function percentEncode(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 */
async function generateHmacSignature(key, data) {
  try {
    const keyBuffer = new TextEncoder().encode(key);
    const dataBuffer = new TextEncoder().encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    const signatureArray = new Uint8Array(signatureBuffer);
    let binaryString = '';
    for (let i = 0; i < signatureArray.length; i++) {
      binaryString += String.fromCharCode(signatureArray[i]);
    }

    return btoa(binaryString);
  } catch (error) {
    throw new Error('Failed to generate HMAC signature: ' + error.message);
  }
}

/**
 * Create OAuth 1.0 authorization header
 */
async function createOAuthHeader(oauthParams, method, url) {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = oauthParams;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

  const urlObj = new URL(url);
  const baseUrl = urlObj.protocol + '//' + urlObj.host + urlObj.pathname;

  const oauthSignatureParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  const queryParams = {};
  for (const [key, value] of urlObj.searchParams) {
    queryParams[key] = value;
  }

  const allParams = { ...oauthSignatureParams, ...queryParams };
  const parameterString = Object.keys(allParams)
    .sort()
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(allParams[key]))
    .join('&');

  const signatureBaseString =
    method.toUpperCase() + '&' + encodeURIComponent(baseUrl) + '&' + encodeURIComponent(parameterString);

  const signingKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(accessTokenSecret);
  const signature = await generateHmacSignature(signingKey, signatureBaseString);

  oauthSignatureParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthSignatureParams)
    .sort()
    .map((key) => key + '="' + encodeURIComponent(oauthSignatureParams[key]) + '"')
    .join(', ');

  return 'OAuth ' + headerParams;
}

/**
 * Extract OAuth credentials from GraphQL context
 */
function extractOAuthCredentials(context) {
  const oauthParams = {
    consumerKey: context.headers['x-commerce-consumer-key'],
    consumerSecret: context.headers['x-commerce-consumer-secret'],
    accessToken: context.headers['x-commerce-access-token'],
    accessTokenSecret: context.headers['x-commerce-access-token-secret'],
  };

  if (!oauthParams.consumerKey || !oauthParams.consumerSecret || 
      !oauthParams.accessToken || !oauthParams.accessTokenSecret) {
    throw new Error('OAuth credentials required in headers');
  }

  return oauthParams;
}

module.exports = {
  percentEncode,
  generateHmacSignature,
  createOAuthHeader,
  extractOAuthCredentials,
};
