/**
 * Base schema for all API endpoints
 * @module schema/api
 */

const baseRequestSchema = {
  type: 'object',
  required: ['COMMERCE_URL', 'COMMERCE_ADMIN_USERNAME', 'COMMERCE_ADMIN_PASSWORD'],
  properties: {
    COMMERCE_URL: {
      type: 'string',
      format: 'uri',
      description: 'Adobe Commerce instance URL',
    },
    COMMERCE_ADMIN_USERNAME: {
      type: 'string',
      description: 'Adobe Commerce admin username',
    },
    COMMERCE_ADMIN_PASSWORD: {
      type: 'string',
      description: 'Adobe Commerce admin password',
    },
    LOG_LEVEL: {
      type: 'string',
      enum: ['error', 'warn', 'info', 'debug'],
      description: 'Logging level',
    },
    env: {
      type: 'string',
      enum: ['dev', 'stage', 'prod'],
      description: 'Environment name',
    },
  },
};

const baseResponseSchema = {
  type: 'object',
  required: ['statusCode', 'headers', 'body'],
  properties: {
    statusCode: {
      type: 'number',
      enum: [200, 400, 401, 403, 500],
      description: 'HTTP status code',
    },
    headers: {
      type: 'object',
      required: ['Content-Type'],
      properties: {
        'Content-Type': {
          type: 'string',
          enum: ['application/json'],
          description: 'Response content type',
        },
      },
    },
    body: {
      type: 'object',
      oneOf: [
        {
          // Success response - to be extended by specific endpoints
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
        {
          // Error response - common across all endpoints
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      ],
    },
  },
};

/**
 * Extends the base request schema with endpoint-specific properties
 * @param {Object} extension - Additional properties for the schema
 * @returns {Object} Extended schema
 */
function extendRequestSchema(extension) {
  return {
    ...baseRequestSchema,
    properties: {
      ...baseRequestSchema.properties,
      ...extension.properties,
    },
    required: [...baseRequestSchema.required, ...(extension.required || [])],
  };
}

/**
 * Extends the base response schema with endpoint-specific success response
 * @param {Object} successSchema - Schema for the success response body
 * @returns {Object} Extended schema
 */
function extendResponseSchema(successSchema) {
  const extendedSchema = {
    ...baseResponseSchema,
    properties: {
      ...baseResponseSchema.properties,
      body: {
        ...baseResponseSchema.properties.body,
        oneOf: [
          {
            type: 'object',
            required: ['message', ...successSchema.required],
            properties: {
              message: baseResponseSchema.properties.body.oneOf[0].properties.message,
              ...successSchema.properties,
            },
          },
          baseResponseSchema.properties.body.oneOf[1], // Keep the error schema
        ],
      },
    },
  };
  return extendedSchema;
}

module.exports = {
  baseRequestSchema,
  baseResponseSchema,
  extendRequestSchema,
  extendResponseSchema,
};
