/**
 * HTMX Template Loader
 * EJS-based template loading utilities for HTMX HTML partials with excellent tooling support
 */

const path = require('path');

const ejs = require('ejs');

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
  const { templateDir = 'templates' } = options;

  try {
    // Step 1: Build template file path
    const templatePath = path.join(__dirname, '..', templateDir, `${templateName}.ejs`);

    // Step 2: Render template with EJS
    const renderedHTML = await ejs.renderFile(templatePath, variables, {
      cache: process.env.NODE_ENV === 'production', // Cache in production
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
  const { templateDir = 'templates' } = options;

  try {
    // Step 1: Build template file path
    const templatePath = path.join(__dirname, '..', templateDir, `${templateName}.ejs`);

    // Step 2: Render template with EJS synchronously
    const fs = require('fs');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    const renderedHTML = ejs.render(templateContent, variables, {
      filename: templatePath, // For proper error reporting
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
 * @purpose Verify EJS template file exists before attempting to load
 * @param {string} templateName - Template file name (without .ejs extension)
 * @param {string} [templateDir] - Template directory name
 * @returns {Promise<boolean>} Whether template file exists
 * @usedBy Template validation utilities
 */
async function templateExists(templateName, templateDir = 'templates') {
  try {
    const fs = require('fs').promises;
    const templatePath = path.join(__dirname, '..', templateDir, `${templateName}.ejs`);
    await fs.access(templatePath);
    return true;
  } catch {
    return false;
  }
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
