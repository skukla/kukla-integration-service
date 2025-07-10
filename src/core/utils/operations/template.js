/**
 * Template operations for utilities
 * @module core/utils/operations/template
 *
 * Provides template substitution and processing utilities for various template systems
 * including mesh resolvers, configuration files, and other template-based generation.
 */

/**
 * Apply generic template substitutions with custom substitution map
 * @param {string} content - Template content with placeholder variables
 * @param {Object} substitutions - Map of variable names to replacement values
 * @param {Object} options - Options for substitution behavior
 * @param {string} options.delimiter - Delimiter pattern (default: '{{{VAR_NAME}}}')
 * @returns {string} Processed content with variables substituted
 *
 * @example
 * const content = 'Hello {{NAME}}, your score is {{SCORE}}';
 * const substitutions = { NAME: 'John', SCORE: '95' };
 * const result = applyGenericSubstitutions(content, substitutions, { delimiter: '{{VAR}}' });
 */
function applyGenericSubstitutions(content, substitutions, options = {}) {
  const { delimiter = '{{{VAR}}}' } = options;

  let processedContent = content;
  Object.entries(substitutions).forEach(([key, value]) => {
    const placeholder = delimiter.replace('VAR', key);
    processedContent = processedContent.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      value
    );
  });

  return processedContent;
}

/**
 * Validate that template content has all required variables substituted
 * @param {string} content - Processed template content
 * @param {Object} options - Validation options
 * @param {string} options.delimiter - Delimiter pattern to check for (default: '{{{.*}}}')
 * @returns {Object} Validation result with any remaining placeholders
 */
function validateTemplateSubstitution(content, options = {}) {
  const { delimiter = '{{{.*}}}' } = options;
  const placeholderRegex = new RegExp(delimiter, 'g');
  const remainingPlaceholders = content.match(placeholderRegex) || [];

  return {
    isValid: remainingPlaceholders.length === 0,
    remainingPlaceholders,
    processedContent: content,
  };
}

module.exports = {
  applyGenericSubstitutions,
  validateTemplateSubstitution,
};
