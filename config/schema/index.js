/**
 * Configuration schema index
 * @module config/schema
 */

const appSchema = require('./app.schema');
const commerceSchema = require('./commerce.schema');
const securitySchema = require('./security.schema');
const storageSchema = require('./storage.schema');
const testingSchema = require('./testing.schema');
const urlSchema = require('./url.schema');

const schema = {
  type: 'object',
  required: ['app', 'url', 'commerce', 'security', 'storage', 'testing'],
  properties: {
    app: appSchema,
    url: urlSchema,
    commerce: commerceSchema,
    security: securitySchema,
    storage: storageSchema,
    testing: testingSchema,
  },
};

module.exports = schema;
