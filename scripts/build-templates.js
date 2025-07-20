#!/usr/bin/env node
/**
 * Template Bundle Generator
 * Generates template bundle with embedded EJS templates for deployment
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate template bundle with embedded templates
 * @purpose Create JavaScript file with all templates embedded as strings
 */
function generateTemplateBundle() {
  const templatesDir = path.join(__dirname, '..', 'src', 'htmx', 'templates');
  const outputFile = path.join(__dirname, '..', 'src', 'htmx', 'shared', 'template-bundle.js');

  console.log('🔧 Generating template bundle...');

  // Read all template files
  const templateFiles = fs.readdirSync(templatesDir).filter((file) => file.endsWith('.ejs'));
  const templates = {};

  templateFiles.forEach((file) => {
    const templateName = path.basename(file, '.ejs');
    const templatePath = path.join(templatesDir, file);
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Escape template content for JavaScript string
    templates[templateName] = templateContent
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    console.log(`  ✓ Bundled template: ${templateName}`);
  });

  // Generate JavaScript module
  const bundleContent = `/**
 * HTMX Template Bundle (Generated)
 * All EJS templates embedded as strings for Adobe I/O Runtime deployment
 * 
 * ⚠️  This file is auto-generated. Do not edit manually.
 * ⚠️  Run 'npm run build:templates' to regenerate.
 */

// Embedded templates
const TEMPLATES = {
${Object.entries(templates)
  .map(([name, content]) => `  '${name}': \`${content}\``)
  .join(',\n')}
};

/**
 * Get template content by name
 * @param {string} templateName - Name of template without .ejs extension
 * @returns {string} Template content as string
 * @throws {Error} If template not found
 */
function getTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) {
    const availableTemplates = Object.keys(TEMPLATES).join(', ');
    throw new Error(\`Template '\${templateName}' not found. Available: \${availableTemplates}\`);
  }
  return template;
}

/**
 * Check if template exists in bundle
 * @param {string} templateName - Name of template to check
 * @returns {boolean} Whether template exists
 */
function hasTemplate(templateName) {
  return templateName in TEMPLATES;
}

/**
 * Get all available template names
 * @returns {Array} Array of template names
 */
function getAvailableTemplates() {
  return Object.keys(TEMPLATES);
}

module.exports = {
  getTemplate,
  hasTemplate,
  getAvailableTemplates,
  TEMPLATES, // Export raw templates for debugging
};
`;

  // Write the bundle
  fs.writeFileSync(outputFile, bundleContent, 'utf8');

  console.log(`✅ Template bundle generated: ${outputFile}`);
  console.log(`   📦 Bundled ${templateFiles.length} templates`);
}

// Run if called directly
if (require.main === module) {
  try {
    generateTemplateBundle();
  } catch (error) {
    console.error('❌ Template bundle generation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { generateTemplateBundle };
