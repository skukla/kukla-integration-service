/**
 * Scripts Core Operations
 * Business operations that provide shared infrastructure
 */

const environment = require('./environment');
const hash = require('./hash');
const scriptFramework = require('./script-framework');
const spinner = require('./spinner');

module.exports = {
  environment,
  spinner,
  hash,
  scriptFramework,
};
