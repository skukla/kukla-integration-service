/**
 * Assertion Helpers - Response Assertions Sub-module
 * HTTP response validation, status checking, and structure verification utilities
 */

/**
 * Assert response structure is valid
 * @purpose Validate that response contains expected structure and fields
 * @param {Object} response - Response object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Assertion result with pass status and messages
 * @usedBy Action and API testing for response validation
 */
function assertResponseStructure(response, requiredFields = []) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || typeof response !== 'object') {
    assertion.pass = false;
    assertion.messages.push('Response must be an object');
    return assertion;
  }

  for (const field of requiredFields) {
    if (response[field] === undefined) {
      assertion.pass = false;
      assertion.messages.push(`Missing required field: ${field}`);
    }
  }

  return assertion;
}

/**
 * Assert response status code
 * @purpose Validate HTTP response status code
 * @param {Object} response - Response object with statusCode
 * @param {number} expectedStatus - Expected status code (default: 200)
 * @returns {Object} Assertion result
 * @usedBy API testing for status code validation
 */
function assertResponseStatus(response, expectedStatus = 200) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.statusCode) {
    assertion.pass = false;
    assertion.messages.push('Response must have statusCode property');
    return assertion;
  }

  if (response.statusCode !== expectedStatus) {
    assertion.pass = false;
    assertion.messages.push(`Expected status ${expectedStatus}, got ${response.statusCode}`);
  }

  return assertion;
}

/**
 * Assert response contains data
 * @purpose Validate that response contains expected data fields
 * @param {Object} response - Response object to validate
 * @param {Array} expectedDataFields - Array of expected data field names
 * @returns {Object} Assertion result
 * @usedBy Action testing for data validation
 */
function assertResponseContainsData(response, expectedDataFields = []) {
  const assertion = {
    pass: true,
    messages: [],
  };

  if (!response || !response.body) {
    assertion.pass = false;
    assertion.messages.push('Response must have body property');
    return assertion;
  }

  let bodyData;
  try {
    bodyData = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  } catch (error) {
    assertion.pass = false;
    assertion.messages.push('Response body must be valid JSON');
    return assertion;
  }

  for (const field of expectedDataFields) {
    if (bodyData[field] === undefined) {
      assertion.pass = false;
      assertion.messages.push(`Response body missing expected field: ${field}`);
    }
  }

  return assertion;
}

module.exports = {
  assertResponseStructure,
  assertResponseStatus,
  assertResponseContainsData,
};
