/**
 * Testing Operations Catalog
 * Mid-level testing functionality shared across workflows
 */

const execution = require('./execution');
const formatting = require('./formatting');
const validation = require('./validation');

/**
 * Testing operations catalog
 * Organizes mid-level testing operations
 */
module.exports = {
  validation,
  execution,
  formatting,
};
