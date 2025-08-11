/**
 * Adobe Commerce admin token generation with caching
 */

const { Core } = require('@adobe/aio-sdk');

async function getCommerceToken(params, config, cache = null, logger = null) {
  const log = logger || Core.Logger('commerce-auth');
  const { baseUrl, api } = config.commerce;

  if (!params.COMMERCE_ADMIN_USERNAME || !params.COMMERCE_ADMIN_PASSWORD) {
    const error = 'Commerce admin credentials not provided';
    log.error('Authentication failed', { error });
    throw new Error(error);
  }

  // Check cache first
  if (cache && cache.enabled) {
    try {
      const cachedToken = await cache.get(
        'admin_token',
        { username: params.COMMERCE_ADMIN_USERNAME },
        'admin_token_cache'
      );
      if (cachedToken) {
        log.info('Using cached Commerce admin token');
        return { token: cachedToken, cacheHit: true };
      }
    } catch (error) {
      log.warn('Failed to retrieve cached token', { error: error.message });
    }
  }

  const tokenUrl = `${baseUrl}/rest/${api.version}${api.paths.adminToken}`;

  try {
    log.info('Requesting Commerce admin token', {
      url: tokenUrl,
      username: params.COMMERCE_ADMIN_USERNAME ? 'provided' : 'missing',
      baseUrl,
      version: api.version,
      tokenPath: api.paths.adminToken,
    });
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: params.COMMERCE_ADMIN_USERNAME,
        password: params.COMMERCE_ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // Use status if can't read error body
      }
      log.error('Token request failed', { status: response.status, error: errorDetails });
      throw new Error(`Token request failed: ${errorDetails}`);
    }

    const token = await response.json();
    const cleanToken = token.replace(/"/g, '');

    // Cache token for reuse
    if (cache && cache.enabled) {
      try {
        await cache.put(
          'admin_token',
          { username: params.COMMERCE_ADMIN_USERNAME },
          'admin_token_cache',
          cleanToken,
          config.cache.adminTokenTtl
        );
        log.info('Cached Commerce admin token for reuse');
      } catch (error) {
        log.warn('Failed to cache token', { error: error.message });
      }
    }

    log.info('Commerce admin token retrieved successfully');
    return { token: cleanToken, cacheHit: false };
  } catch (error) {
    log.error('Commerce token generation failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle token expiration during Commerce API operations
 * @param {Object} cache - Cache instance
 * @param {string} username - Commerce admin username
 * @param {Object} logger - Logger instance
 */
async function handleTokenExpiration(cache, username, logger) {
  if (logger) logger.warn('Admin token expired, invalidating cache and will need fresh token');
  await cache.invalidate('admin_token', { username }, 'admin_token_cache');
  throw new Error('ADMIN_TOKEN_EXPIRED');
}

module.exports = {
  getCommerceToken,
  handleTokenExpiration,
};
