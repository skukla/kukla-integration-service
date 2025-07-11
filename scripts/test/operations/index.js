/**
 * Test Domain Operations
 * Business operations specific to testing processes
 *
 * Following Strategic Duplication approach - domain-specific utilities
 * for test URL building and response handling.
 *
 * Pure exporter pattern - no function implementations in index.js
 */

const parameterHandling = require('./parameter-handling');
const responseHandling = require('./response-handling');
const testDispatch = require('./test-dispatch');
const testExecution = require('./test-execution');
const urlBuilding = require('./url-building');

module.exports = {
  parameterHandling,
  responseHandling,
  testDispatch,
  testExecution,
  urlBuilding,
};
