/**
 * Adobe App Builder Action: Cache Control Admin Endpoint
 * Emergency kill switch for cache functionality
 */

const stateLib = require('@adobe/aio-lib-state');
const { Core } = require('@adobe/aio-sdk');

const { errorResponse, successResponse } = require('../../lib/utils');

async function main(params) {
  const logger = Core.Logger('cache-control', { level: params.LOG_LEVEL || 'info' });

  try {
    // Initialize state
    const state = await stateLib.init();

    // Handle different actions
    const action = params.action || 'status';

    switch (action) {
      case 'disable':
        await state.put('cache_kill_switch', 'true', { ttl: 86400 * 365 }); // 1 year TTL
        logger.warn('Cache kill switch ACTIVATED - all caching disabled');
        return successResponse({
          success: true,
          cacheEnabled: false,
          message: '✖ Cache disabled globally via kill switch',
        });

      case 'enable':
        await state.delete('cache_kill_switch');
        logger.info('Cache kill switch DEACTIVATED - caching restored');
        return successResponse({
          success: true,
          cacheEnabled: true,
          message: '✔ Cache enabled - kill switch removed',
        });

      case 'status': {
        const killSwitch = await state.get('cache_kill_switch');
        const isDisabled = killSwitch?.value === 'true';
        return successResponse({
          success: true,
          cacheEnabled: !isDisabled,
          killSwitchActive: isDisabled,
          message: isDisabled
            ? '✖ Cache is DISABLED via kill switch'
            : '✔ Cache is ENABLED (normal operation)',
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
