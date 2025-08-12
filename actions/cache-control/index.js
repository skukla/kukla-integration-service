/**
 * Adobe App Builder Action: Cache Control Admin Endpoint
 * Runtime cache override for emergency control
 */

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');

const createConfig = require('../../config');
const { errorResponse, successResponse } = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('cache-control', { level: params.LOG_LEVEL || 'info' });

  try {
    // Initialize configuration and state
    const config = createConfig(params);
    const state = await stateLib.init();

    // Handle different actions
    const action = params.action || 'status';

    switch (action) {
      case 'disable':
        await state.put('cache_override', 'disabled', { ttl: config.cache.overrideTtl });
        logger.warn('Cache override ACTIVATED - caching disabled');
        return successResponse({
          success: true,
          cacheEnabled: false,
          message: '✔ Cache disabled successfully',
        });

      case 'enable':
        await state.delete('cache_override');
        logger.info('Cache override REMOVED - normal caching restored');
        return successResponse({
          success: true,
          cacheEnabled: true,
          message: '✔ Cache enabled successfully',
        });

      case 'status': {
        const cacheOverride = await state.get('cache_override');
        const isDisabled = cacheOverride?.value === 'disabled';
        return successResponse({
          success: true,
          cacheEnabled: !isDisabled,
          overrideActive: isDisabled,
          message: isDisabled ? 'Cache is currently DISABLED' : 'Cache is currently ENABLED',
        });
      }

      default:
        return errorResponse(400, 'Invalid action. Use: disable, enable, or status', logger);
    }
  } catch (error) {
    logger.error('Cache control operation failed', { error: error.message });
    return errorResponse(500, `Failed to control cache: ${error.message}`, logger);
  }
}

exports.main = main;
