/**
 * Build Domain - Mesh Generation Output Operations
 * Handles detailed progress output and summary generation for mesh workflows
 */

const format = require('../../core/formatting');

/**
 * Display initial setup with environment info
 * @param {string} environment - Environment name
 */
async function displayInitialSetup(environment) {
  console.log(format.success(`Environment: ${format.environment(environment)}`));
  console.log();
  console.log(format.deploymentStart('Starting mesh resolver generation...'));
  console.log();
  await format.sleep(500);
}

/**
 * Display configuration loading progress
 */
async function displayConfigurationLoading() {
  console.log(format.deploymentAction('Loading configuration...'));
  // Steps handle their own success messages
  await format.sleep(300);
}

/**
 * Display mesh configuration extraction progress
 */
async function displayMeshConfigExtraction() {
  console.log();
  console.log(format.deploymentAction('Extracting mesh configuration...'));
  console.log(format.muted('  → Processing mesh.config.js'));
  console.log(format.muted('  → Loading external GraphQL schemas'));
  console.log(format.muted('  → Converting AST to Adobe API Mesh format'));
}

/**
 * Display mesh configuration extraction success
 * @param {string} outputPath - Path to generated file
 */
async function displayMeshConfigSuccess(outputPath) {
  console.log(format.success('Mesh configuration extracted'));
  console.log(format.muted(`  → Generated: ${outputPath}`));
  await format.sleep(300);
}

/**
 * Display template processing progress
 */
async function displayTemplateProcessing() {
  console.log();
  console.log(format.deploymentAction('Processing mesh resolver template...'));
  console.log(format.muted('  → Reading mesh-resolvers.template.js'));
  console.log(format.muted('  → Substituting configuration values'));
  console.log(format.muted('  → Checking if regeneration needed'));
}

/**
 * Display template processing result
 * @param {Object} templateResult - Template processing result
 */
async function displayTemplateResult(templateResult) {
  if (templateResult.resolverGenerated) {
    console.log(format.success('Mesh resolver regenerated'));
    console.log(format.muted('  → Generated: mesh-resolvers.js'));
    console.log(format.muted(`  → Source: ${templateResult.source}`));
  } else {
    console.log(format.success('Mesh resolver up to date'));
    console.log(format.muted(`  → Reason: ${templateResult.reason}`));
    console.log(format.muted(`  → Source: ${templateResult.source}`));
  }
  await format.sleep(300);
}

/**
 * Display completion celebration and summary
 * @param {string} environment - Environment name
 * @param {Object} meshConfigResult - Mesh config result
 * @param {Object} templateResult - Template result
 */
async function displayCompletionSummary(environment, meshConfigResult, templateResult) {
  console.log();
  console.log(format.celebration('Mesh generation completed successfully!'));
  console.log();
  
  // Summary information
  console.log(format.sectionHeader('Generation Summary'));
  console.log(format.section(`Environment: ${environment}`));
  console.log(format.section(`Mesh Config: Generated (${meshConfigResult.outputPath})`));
  console.log(format.section(`Resolver: ${templateResult.resolverGenerated ? 'Regenerated' : 'Up to date'}`));
  if (templateResult.resolverGenerated) {
    console.log(format.section(`Generation Source: ${templateResult.source}`));
  }
  console.log();
  
  console.log(format.sectionHeader('Generated Files'));
  console.log(format.section('mesh.json - Adobe API Mesh configuration'));
  console.log(format.section('mesh-resolvers.js - Custom GraphQL resolvers'));
  console.log();
}

module.exports = {
  displayInitialSetup,
  displayConfigurationLoading,
  displayMeshConfigExtraction,
  displayMeshConfigSuccess,
  displayTemplateProcessing,
  displayTemplateResult,
  displayCompletionSummary,
}; 
