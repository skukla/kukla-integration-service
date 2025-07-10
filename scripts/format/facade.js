/**
 * Format Domain Facade
 * Simplified high-level formatting functions for common script patterns
 * Clean, readable API that hides internal complexity
 */

const { scriptLifecycleWorkflow } = require('./workflows');

/**
 * Build lifecycle shortcuts
 */
async function buildStart() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'build',
    target: '',
    emphasis: true,
  });
  return workflow.start();
}

async function buildDone() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'build',
    target: '',
    emphasis: true,
  });
  return workflow.complete();
}

/**
 * Deploy lifecycle shortcuts
 */
async function deployStart() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'deployment',
    target: '',
    emphasis: true,
  });
  return workflow.start();
}

async function deployDone() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'deployment',
    target: '',
    emphasis: true,
  });
  return workflow.complete();
}

/**
 * Test lifecycle shortcuts
 */
async function testStart() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'testing',
    target: '',
    emphasis: true,
  });
  return workflow.start();
}

async function testDone() {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'testing',
    target: '',
    emphasis: true,
  });
  return workflow.complete();
}

/**
 * Mesh lifecycle shortcuts - CLEAN PATTERN
 */
async function meshStart(environment = '') {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'mesh update',
    target: environment,
    emphasis: true,
  });
  return workflow.start();
}

async function meshDone(environment = '') {
  const workflow = await scriptLifecycleWorkflow({
    operation: 'mesh update',
    target: environment,
    emphasis: true,
  });
  return workflow.complete();
}

/**
 * Mesh operation shortcuts - CLEAN PATTERN
 */
function meshUpdateStart() {
  return '🔗 Updating API Mesh configuration...';
}

function meshPollingStart(pollInterval, maxChecks) {
  return `⏳ Polling mesh status (${pollInterval}s intervals, max ${maxChecks} checks)...`;
}

module.exports = {
  buildStart,
  buildDone,
  deployStart,
  deployDone,
  testStart,
  testDone,
  meshStart,
  meshDone,
  meshUpdateStart,
  meshPollingStart,
};
