#!/usr/bin/env node

/**
 * Unified Performance Testing Script
 * Replaces scattered ad-hoc mesh testing scripts with framework-based approach
 */

const chalk = require('chalk');
const ora = require('ora');

const { parseArgs } = require('../src/core/cli/args');
const { testScenario } = require('../src/core/testing/performance');
const scenarios = require('../src/core/testing/performance/scenarios');

/**
 * Formats performance results for display
 * @param {Object} result Test result
 * @returns {string} Formatted output
 */
function formatResults(result) {
  if (!result.passed) {
    return chalk.red(`❌ FAILED: ${result.error || 'Unknown error'}`);
  }

  switch (result.type) {
    case 'comparative': {
      const { comparison } = result;
      const faster = chalk.green(comparison.fasterAction);
      const slower = chalk.yellow(comparison.slowerAction);
      const diff = comparison.percentDifference.toFixed(1);
      const tolerance = comparison.withinTolerance ? '✅' : '⚠️';

      return `${tolerance} ${faster} vs ${slower}: ${diff}% difference`;
    }

    case 'optimization': {
      const { optimal, analysis } = result;
      const optTime = optimal.executionTime.toFixed(0);
      const avgTime = analysis.averageTime.toFixed(0);

      return `✅ Optimal: ${optimal.name} (${optTime}ms vs ${avgTime}ms avg)`;
    }

    case 'standard': {
      const { metrics } = result;
      const time = metrics.executionTime?.toFixed(0) || 'N/A';
      const apiCalls = metrics.apiCalls ? ` | ${metrics.apiCalls} API calls` : '';

      return `✅ Completed: ${time}ms${apiCalls}`;
    }

    default:
      return '✅ Passed';
  }
}

/**
 * Displays detailed analysis if available
 * @param {Object} result Test result
 */
function displayDetailedAnalysis(result) {
  if (!result.analysis) return;

  console.log(chalk.cyan('\n📊 Detailed Analysis:'));

  if (result.analysis.breakdown) {
    console.log('Step-by-step timing:');
    Object.entries(result.analysis.breakdown).forEach(([step, data]) => {
      const time = data.time || 0;
      const percent = data.percent || 0;
      console.log(`  ${step}: ${time.toFixed(0)}ms (${percent.toFixed(1)}%)`);
    });
  }

  if (result.analysis.apiCalls) {
    console.log('\nAPI Call Analysis:');
    Object.entries(result.analysis.apiCalls).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} calls`);
    });
  }

  if (result.recommendations) {
    console.log(chalk.yellow('\n💡 Recommendations:'));
    result.recommendations.forEach((rec) => console.log(`  • ${rec}`));
  }
}

/**
 * Runs specific scenario
 * @param {string} scenarioName Name of scenario to run
 * @param {Object} options Test options
 */
async function runScenario(scenarioName, options = {}) {
  const scenario = scenarios[scenarioName];
  if (!scenario) {
    console.error(chalk.red(`❌ Unknown scenario: ${scenarioName}`));
    console.log('Available scenarios:', Object.keys(scenarios).join(', '));
    process.exit(1);
  }

  const spinner = ora(`Running ${scenario.name}...`).start();

  try {
    const result = await testScenario(scenario, {
      environment: options.environment,
      iterations: options.iterations,
      includeAnalysis: options.analysis,
    });

    spinner.stop();
    console.log(`${scenario.name}: ${formatResults(result)}`);

    if (options.verbose || options.analysis) {
      displayDetailedAnalysis(result);
    }

    return result.passed;
  } catch (error) {
    spinner.fail(`${scenario.name}: ${error.message}`);
    return false;
  }
}

/**
 * Runs multiple scenarios
 * @param {Array} scenarioNames List of scenarios to run
 * @param {Object} options Test options
 */
async function runMultipleScenarios(scenarioNames, options = {}) {
  const results = [];

  for (const name of scenarioNames) {
    const passed = await runScenario(name, options);
    results.push({ name, passed });
  }

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(chalk.cyan(`\n📋 Summary: ${passed}/${total} scenarios passed`));

  if (passed < total) {
    const failed = results.filter((r) => !r.passed).map((r) => r.name);
    console.log(chalk.red('Failed scenarios:'), failed.join(', '));
    process.exit(1);
  }
}

// Parse command line arguments
const args = parseArgs(process.argv.slice(2), {
  flags: {
    env: 'staging', // --env <environment>
    verbose: false, // --verbose
    analysis: false, // --analysis (detailed breakdown)
    iterations: 1, // --iterations <number>
    scenario: null, // --scenario <name>
    list: false, // --list (show available scenarios)
  },
});

/**
 * Main execution
 */
async function main() {
  // List available scenarios
  if (args.list) {
    console.log(chalk.cyan('Available Performance Scenarios:'));
    Object.entries(scenarios).forEach(([key, scenario]) => {
      console.log(`  ${chalk.green(key)}: ${scenario.description}`);
    });
    return;
  }

  const options = {
    environment: args.env === 'staging' ? 'local' : 'deployed',
    iterations: parseInt(args.iterations) || 1,
    verbose: args.verbose,
    analysis: args.analysis,
  };

  // Run specific scenario
  if (args.scenario) {
    const passed = await runScenario(args.scenario, options);
    process.exit(passed ? 0 : 1);
    return;
  }

  // Default: run key scenarios
  const keyScenarios = ['rest-api-baseline', 'mesh-baseline', 'rest-vs-mesh'];

  if (args.analysis) {
    keyScenarios.push('mesh-analysis');
  }

  await runMultipleScenarios(keyScenarios, options);
}

// Handle command line usage
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('❌ Test execution failed:'), error.message);
    process.exit(1);
  });
}

module.exports = {
  runScenario,
  runMultipleScenarios,
  formatResults,
};
