/**
 * Baseline operations for performance testing
 * Contains core baseline file operations and validation logic
 * @module core/testing/performance/operations/baseline-operations
 */

const fs = require('fs');

/**
 * Loads baseline metrics from file
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 * @returns {Object|null} Baseline data or null
 */
function loadBaselines(baselineConfig, spinner) {
  try {
    if (fs.existsSync(baselineConfig.baselineFile)) {
      return JSON.parse(fs.readFileSync(baselineConfig.baselineFile, 'utf8'));
    }
  } catch (error) {
    spinner.warn('No baseline metrics found or error loading baseline');
  }
  return null;
}

/**
 * Saves baseline metrics to file
 * @param {string} scenarioName - Scenario name
 * @param {Object} metrics - Performance metrics
 * @param {string} environment - Environment name
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 */
function saveBaseline(scenarioName, metrics, environment, baselineConfig, spinner) {
  try {
    let baselines = {};
    if (fs.existsSync(baselineConfig.baselineFile)) {
      baselines = JSON.parse(fs.readFileSync(baselineConfig.baselineFile, 'utf8'));
    }
    if (!baselines[environment]) {
      baselines[environment] = {};
    }
    baselines[environment][scenarioName] = {
      timestamp: new Date().toISOString(),
      metrics,
    };
    fs.writeFileSync(baselineConfig.baselineFile, JSON.stringify(baselines, null, 2));
    spinner.succeed(`Baseline metrics saved for ${scenarioName} in ${environment} environment`);
  } catch (error) {
    spinner.fail('Error saving baseline metrics');
  }
}

/**
 * Checks if baseline exists and is valid
 * @param {string} scenarioName - Scenario name
 * @param {string} environment - Environment name
 * @param {Object} baselineConfig - Baseline configuration
 * @param {Object} spinner - Spinner instance
 * @returns {Object} Baseline check result
 */
function checkBaseline(scenarioName, environment, baselineConfig, spinner) {
  const baselines = loadBaselines(baselineConfig, spinner);
  if (!baselines || !baselines[environment] || !baselines[environment][scenarioName]) {
    spinner.warn(`No baseline found for "${scenarioName}" in ${environment} environment`);
    return { needsBaseline: true };
  }

  const baseline = baselines[environment][scenarioName];
  const baselineDate = new Date(baseline.timestamp);
  const now = new Date();
  const daysOld = (now - baselineDate) / (1000 * 60 * 60 * 24);

  if (daysOld > baselineConfig.maxAgeDays) {
    spinner.warn(
      `Baseline for "${scenarioName}" in ${environment} environment is ${daysOld.toFixed(1)} days old`
    );
    return { needsBaseline: true };
  }

  spinner.succeed(`Valid baseline found for "${scenarioName}" in ${environment} environment`);
  return { needsBaseline: false, baseline: baseline.metrics };
}

/**
 * Validates and loads baseline data for comparison
 * @param {Object} baselines - All baseline data
 * @param {string} scenarioName - Scenario name
 * @param {string} environment - Environment name
 * @param {Object} spinner - Spinner instance
 * @returns {Object|null} Baseline metrics or null if not found
 */
function validateBaselineData(baselines, scenarioName, environment, spinner) {
  if (!baselines || !baselines[environment] || !baselines[environment][scenarioName]) {
    spinner.warn(`No baseline available for comparison in ${environment} environment`);
    return null;
  }
  return baselines[environment][scenarioName].metrics;
}

module.exports = {
  loadBaselines,
  saveBaseline,
  checkBaseline,
  validateBaselineData,
};
