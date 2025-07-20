/**
 * HTMX Template Loader
 * EJS-based template loading utilities for HTMX HTML partials with excellent tooling support
 */

const ejs = require('ejs');

// Import embedded templates for deployment
const { getTemplate, hasTemplate } = require('./template-bundle');

/**
 * Load and render EJS template with variable substitution
 * @purpose Load EJS template file and render with variables for dynamic content
 * @param {string} templateName - Template file name (without .ejs extension)
 * @param {Object} variables - Variables to pass to template
 * @param {Object} [options] - EJS rendering options
 * @returns {Promise<string>} Rendered HTML with variables substituted
 * @usedBy All HTMX partial generators for file-based templates
 */
async function loadTemplate(templateName, variables = {}, options = {}) {
  try {
    // Step 1: Get template content from embedded bundle
    const templateContent = getTemplate(templateName);

    // Step 2: Render template with EJS
    const renderedHTML = ejs.render(templateContent, variables, {
      cache: process.env.NODE_ENV === 'production',
      filename: `${templateName}.ejs`, // For error reporting
      ...options,
    });

    return renderedHTML;
  } catch (error) {
    throw new Error(`Failed to load template '${templateName}': ${error.message}`);
  }
}

/**
 * Load template synchronously for performance-critical paths
 * @purpose Load EJS template file synchronously with variable substitution
 * @param {string} templateName - Template file name (without .ejs extension)
 * @param {Object} variables - Variables to pass to template
 * @param {Object} [options] - EJS rendering options
 * @returns {string} Rendered HTML with variables substituted
 * @usedBy HTMX generators that need synchronous template loading
 */
function loadTemplateSync(templateName, variables = {}, options = {}) {
  try {
    // Step 1: Get template content from embedded bundle
    const templateContent = getTemplate(templateName);

    // Step 2: Render template with EJS synchronously
    const renderedHTML = ejs.render(templateContent, variables, {
      filename: `${templateName}.ejs`, // For proper error reporting
      cache: process.env.NODE_ENV === 'production',
      ...options,
    });

    return renderedHTML;
  } catch (error) {
    throw new Error(`Failed to load template '${templateName}': ${error.message}`);
  }
}

/**
 * Check if template file exists
 * @purpose Verify EJS template exists in bundle
 * @param {string} templateName - Template file name (without .ejs extension)
 * @returns {Promise<boolean>} Whether template exists
 * @usedBy Template validation utilities
 */
async function templateExists(templateName) {
  return hasTemplate(templateName);
}

/**
 * Configure EJS global settings for all template rendering
 * @purpose Set up EJS with optimized settings for our HTMX use case
 * @param {Object} settings - EJS configuration settings
 * @usedBy Application initialization for template engine setup
 */
function configureEJS(settings = {}) {
  const defaultSettings = {
    cache: process.env.NODE_ENV === 'production',
    compileDebug: process.env.NODE_ENV !== 'production',
    delimiter: '%', // Keep default <%= %> syntax
    openDelimiter: '<',
    closeDelimiter: '>',
    rmWhitespace: true, // Remove extra whitespace for cleaner HTML
  };

  Object.assign(ejs.cache, {});
  Object.assign(ejs, { ...defaultSettings, ...settings });
}

module.exports = {
  // Template loading (main functions)
  loadTemplate,
  loadTemplateSync,

  // Template utilities
  templateExists,
  configureEJS,

  // Direct EJS access for advanced usage
  ejs,
};
