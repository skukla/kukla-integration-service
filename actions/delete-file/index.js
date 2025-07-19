/**
 * File Deletion Action
 * Business capability: Delete files with comprehensive validation
 */

const { deleteFileWithValidation } = require('../../src/files/file-deletion');
const { createAction } = require('../../src/shared/action/action-factory');

/**
 * File deletion business logic
 * @purpose Execute file deletion workflow with comprehensive validation
 * @param {Object} context - Initialized action context with config and parameters
 * @returns {Promise<Object>} Deletion result with success confirmation
 * @usedBy Adobe App Builder frontend
 * @config storage.provider, files.protectedPatterns, storage.directory
 */
async function deleteFileBusinessLogic(context) {
  const { config, extractedParams } = context;

  // Step 1: Validate fileName parameter
  if (!extractedParams.fileName) {
    throw new Error('fileName parameter is required');
  }

  // Step 2: Execute validated file deletion
  return await deleteFileWithValidation(extractedParams.fileName, config, extractedParams);
}

module.exports = createAction(deleteFileBusinessLogic, {
  actionName: 'delete-file',
  withLogger: false,
  description: 'Delete file from storage',
});
