/**
 * Scripts Core Operations
 * Mid-level operations shared across all script domains
 */

const environment = require('./environment');
const formatting = require('./formatting');
const hash = require('./hash');
const mesh = require('./mesh');
const meshTemplates = require('./mesh-templates');
const scriptFramework = require('./script-framework');
const spinner = require('./spinner');

module.exports = {
  environment,
  hash,
  mesh,
  scriptFramework,
  spinner,
  formatting,
  meshTemplates,
};
