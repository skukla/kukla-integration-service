/**
 * Test Domain - Help and Error Display Operations
 * Pure operations for displaying help text and error messages
 */

const { showTestHelp } = require('../../core/args');
const format = require('../../core/formatting');

/**
 * Display invalid action format error with helpful suggestion
 * Pure operation that shows format error and suggested correction
 *
 * @param {string} suggestedAction - The action name that was likely intended
 */
function displayInvalidFormatError(suggestedAction) {
  console.log(format.error('Invalid format. Action tests require --action=<name> format.'));
  console.log('\nUsage: npm run test:action --action=<action> [options]');
  console.log('\nExamples:');
  console.log('  npm run test:action -- --action=get-products');
  console.log('  npm run test:action -- --action=get-products --use-case=adobeTarget');

  if (suggestedAction) {
    console.log(`\nDid you mean: npm run test:action -- --action=${suggestedAction}?`);
  }
}

/**
 * Display missing arguments error with help
 * Pure operation that shows missing arguments error and help text
 *
 * @param {string} message - Error message to display
 */
function displayMissingArgumentsError(message) {
  console.log(format.error(message));
  showTestHelp();
}

/**
 * Display test execution error
 * Pure operation that shows test execution errors for specific test types
 *
 * @param {string} testType - The type of test that failed
 * @param {string} error - Error message to display
 */
function displayTestExecutionError(testType, error) {
  // Only show error if it wasn't already displayed in detailed results
  // Action and API tests show comprehensive response content including errors
  if (!['action', 'api'].includes(testType) && error) {
    console.log(format.error(error));
  }
}

module.exports = {
  displayInvalidFormatError,
  displayMissingArgumentsError,
  displayTestExecutionError,
};
