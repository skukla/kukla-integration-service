/**
 * HTTP Configuration Operations
 * @module core/http/operations/config
 */

const https = require('https');

/**
 * Creates an HTTPS agent that accepts self-signed certificates
 * @returns {https.Agent} HTTPS agent
 */
function createHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: false,
  });
}

module.exports = {
  createHttpsAgent,
};
