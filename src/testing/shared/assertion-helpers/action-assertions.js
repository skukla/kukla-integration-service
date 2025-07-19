/**
 * Assertion Helpers - Action Assertions Sub-module
 * Action-specific validation, success checking, and download URL verification utilities
 */

/**
 * Assert action execution success
 * @purpose Validate that action executed successfully with expected results
 * @param {Object} actionResult - Result from action execution
 * @param {Array} expectedFields - Array of expected result fields
 * @returns {Object} Assertion result
 * @usedBy Action testing for success validation
 */
function assertActionSuccess(actionResult, expectedFields = []) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!actionResult || typeof actionResult !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Action result must be an object');
    return assertion;
  }

  // Check for success indicators
  if (actionResult.success === false) {
    assertion.pass = false;
    assertion.messages.push('Action result indicates failure');
  }

  if (actionResult.error) {
    assertion.pass = false;
    assertion.messages.push(`Action error: ${actionResult.error}`);
  }

  // Check for expected fields
  for (const field of expectedFields) {
    if (actionResult[field] === undefined) {
      assertion.pass = false;
      assertion.messages.push(`Action result missing expected field: ${field}`);
    }
  }

  return assertion;
}

/**
 * Assert action download URL is valid
 * @purpose Validate that action provides valid download URL
 * @param {Object} actionResult - Result from action execution
 * @param {Object} options - Validation options
 * @returns {Object} Assertion result
 * @usedBy Action testing for download URL validation
 */
function assertActionDownloadUrl(actionResult, options = {}) {
  const assertion = {
    pass: true,
    messages: [],
  };

  const { required = true, mustBePresigned = false } = options;

  if (!actionResult || typeof actionResult !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Action result must be an object');
    return assertion;
  }

  const downloadUrl = actionResult.downloadUrl;

  if (required && !downloadUrl) {
    assertion.pass = false;
    assertion.messages.push('Action result missing required downloadUrl');
    return assertion;
  }

  if (downloadUrl) {
    try {
      const url = new URL(downloadUrl);

      if (mustBePresigned) {
        // Check for presigned URL characteristics
        const hasAwsSignature =
          url.searchParams.has('X-Amz-Signature') || url.searchParams.has('Signature');
        if (!hasAwsSignature) {
          assertion.pass = false;
          assertion.messages.push('Download URL must be a presigned URL');
        }
      }
    } catch (error) {
      assertion.pass = false;
      assertion.messages.push(`Invalid download URL: ${error.message}`);
    }
  }

  return assertion;
}

module.exports = {
  assertActionSuccess,
  assertActionDownloadUrl,
};
