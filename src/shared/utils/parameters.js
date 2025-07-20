/**
 * Parameter Resolution Utilities
 * Consistent parameter resolution with clear fallback order: params → env → config
 */

/**
 * Get parameter with consistent fallback: params → env → config
 * @purpose Provide single source of truth for parameter resolution
 * @param {string} key - Parameter key
 * @param {Object} sources - Sources to check
 * @param {Object} sources.params - Action parameters
 * @param {Object} sources.env - Environment variables (optional, defaults to process.env)
 * @param {Object} sources.config - Configuration object
 * @param {string} sources.envKey - Environment variable name (optional, defaults to key.toUpperCase())
 * @param {string} sources.configPath - Config path like 'commerce.baseUrl' (optional, defaults to key)
 * @returns {*} Parameter value or undefined
 * @usedBy All domain modules that need parameter resolution
 */
function getParameter(key, sources) {
  const { params = {}, env = process.env, config = {}, envKey, configPath } = sources;

  // 1. Check action parameters first (clean names)
  if (params[key] !== undefined) {
    return params[key];
  }

  // 2. Check action parameters with environment variable names (Adobe I/O Runtime)
  const envVarName = envKey || key.toUpperCase();
  if (params[envVarName] !== undefined) {
    return params[envVarName];
  }

  // 3. Check environment variables (local development)
  if (env[envVarName] !== undefined) {
    return env[envVarName];
  }

  // 4. Check configuration
  const configKey = configPath || key;
  const configValue = getConfigValue(config, configKey);
  if (configValue !== undefined) {
    return configValue;
  }

  return undefined;
}

/**
 * Get required parameter with validation
 * @purpose Get parameter that must exist or throw error
 * @param {string} key - Parameter key
 * @param {Object} sources - Parameter sources
 * @returns {*} Parameter value
 * @throws {Error} If parameter is missing
 * @usedBy Modules that need required parameters
 */
function getRequiredParameter(key, sources) {
  const value = getParameter(key, sources);
  if (value === undefined || value === '') {
    const { envKey, configPath } = sources;
    const envVarName = envKey || key.toUpperCase();

    throw new Error(
      `Required parameter '${key}' not found\n` +
        `   → Check environment variable: ${envVarName}\n` +
        `   → Or action parameter: ${key}\n` +
        `   → Or configuration path: ${configPath || key}\n` +
        '   → For Adobe I/O Runtime actions, ensure environment variables are properly configured'
    );
  }
  return value;
}

/**
 * Get configuration value using dot notation
 * @purpose Access nested config values safely
 * @param {Object} config - Configuration object
 * @param {string} path - Dot notation path
 * @returns {*} Configuration value or undefined
 */
function getConfigValue(config, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

/**
 * Get Commerce parameters (simple convenience function)
 * @purpose Get common Commerce parameters with correct fallback paths
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Commerce parameters
 * @usedBy Commerce domain modules
 */
function getCommerceParameters(params, config) {
  return {
    baseUrl: getRequiredParameter('baseUrl', {
      params,
      config,
      envKey: 'COMMERCE_BASE_URL',
      configPath: 'commerce.baseUrl',
    }),
    adminUsername: getRequiredParameter('adminUsername', {
      params,
      config,
      envKey: 'COMMERCE_ADMIN_USERNAME',
      configPath: 'commerce.adminUsername',
    }),
    adminPassword: getRequiredParameter('adminPassword', {
      params,
      config,
      envKey: 'COMMERCE_ADMIN_PASSWORD',
      configPath: 'commerce.adminPassword',
    }),
    timeout: getParameter('timeout', {
      params,
      config,
      envKey: 'COMMERCE_TIMEOUT',
      configPath: 'commerce.api.timeout',
    }),
  };
}

/**
 * Get AWS parameters (storage-provider aware)
 * @purpose Get AWS parameters - required for S3 storage, optional for app-builder storage
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Object} AWS parameters
 * @usedBy AWS/S3 domain modules, storage strategy selection
 */
function getAwsParameters(params, config) {
  const storageProvider = config?.storage?.provider || 'app-builder';
  const isS3Required = storageProvider === 's3';

  const parameterResolver = isS3Required ? getRequiredParameter : getParameter;

  return {
    accessKeyId: parameterResolver('AWS_ACCESS_KEY_ID', {
      params,
      config,
      envKey: 'AWS_ACCESS_KEY_ID',
      configPath: 'aws.accessKeyId',
    }),
    secretAccessKey: parameterResolver('AWS_SECRET_ACCESS_KEY', {
      params,
      config,
      envKey: 'AWS_SECRET_ACCESS_KEY',
      configPath: 'aws.secretAccessKey',
    }),
    region: getParameter('AWS_REGION', {
      params,
      config,
      envKey: 'AWS_REGION',
      configPath: 'aws.region',
    }),
    // Indicate whether these parameters are required for current storage strategy
    isRequired: isS3Required,
  };
}

/**
 * Get Mesh parameters (simple convenience function)
 * @purpose Get common API Mesh parameters with correct fallback paths
 * @param {Object} params - Action parameters
 * @returns {Object} Mesh parameters
 * @usedBy API Mesh domain modules
 */
function getMeshParameters(params) {
  return {
    endpoint: getRequiredParameter('API_MESH_ENDPOINT', {
      params,
      envKey: 'API_MESH_ENDPOINT',
    }),
    apiKey: getRequiredParameter('MESH_API_KEY', {
      params,
      envKey: 'MESH_API_KEY',
    }),
  };
}

/**
 * Get Runtime parameters with intelligent URL construction
 * @purpose Get required Runtime parameters with smart fallbacks to AIO_ variables
 * @param {Object} params - Action parameters
 * @param {Object} config - Configuration object
 * @returns {Object} Runtime parameters with url and namespace
 * @throws {Error} If required runtime parameters are missing
 * @usedBy Runtime domain modules, test scripts
 */
function getRuntimeParameters(params, config) {
  // Get namespace with fallback to AIO_runtime_namespace, then hardcoded staging namespace
  const namespace =
    getParameter('namespace', {
      params,
      config,
      envKey: 'RUNTIME_NAMESPACE',
      configPath: 'runtime.namespace',
    }) ||
    process.env.AIO_runtime_namespace ||
    '285361-188maroonwallaby-stage'; // Fallback for staging environment

  // Get URL with smart construction from namespace if not explicitly set
  let url = getParameter('url', {
    params,
    config,
    envKey: 'RUNTIME_URL',
    configPath: 'runtime.url',
  });

  // If no explicit URL, construct from namespace using correct domain
  if (!url && namespace) {
    url = `https://${namespace}.adobeio-static.net`;
  }

  // Validate we have both required values
  if (!url) {
    throw new Error(
      'Runtime URL not found. Provide RUNTIME_URL environment variable or ensure AIO_runtime_namespace is available for URL construction.'
    );
  }

  if (!namespace) {
    throw new Error(
      'Runtime namespace not found. Provide RUNTIME_NAMESPACE or ensure AIO_runtime_namespace is available.'
    );
  }

  return { url, namespace };
}

module.exports = {
  getParameter,
  getRequiredParameter,
  getCommerceParameters,
  getAwsParameters,
  getMeshParameters,
  getRuntimeParameters,
};
