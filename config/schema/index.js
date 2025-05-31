/**
 * Configuration schemas
 * @module config/schema
 */

const appSchema = require('./app.schema');
const commerceSchema = require('./commerce.schema');
const securitySchema = require('./security.schema');
const urlSchema = require('./url.schema');

module.exports = {
  app: appSchema,
  url: urlSchema,
  commerce: commerceSchema,
  security: securitySchema,
};
