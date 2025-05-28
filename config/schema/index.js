/**
 * Configuration schemas
 * @module config/schema
 */

const appSchema = require('./app.schema');
const urlSchema = require('./url.schema');
const commerceSchema = require('./commerce.schema');
const securitySchema = require('./security.schema');
const apiTestSchema = require('./api-testing.schema');
const performanceTestSchema = require('./performance-testing.schema');

module.exports = {
    app: appSchema,
    url: urlSchema,
    commerce: commerceSchema,
    security: securitySchema,
    testing: {
        api: apiTestSchema,
        performance: performanceTestSchema
    }
}; 