/**
 * Format Domain Facade
 * Simple, direct functions for common formatting needs
 * No complex objects or nested APIs - just clean functions
 */

const operations = require('./operations');
const utils = require('./utils');
const workflows = require('./workflows');

// Simple lifecycle functions
async function buildStart() {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'build',
    target: '',
    emphasis: true,
  });
  return workflow.start();
}

async function buildDone() {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'build',
    target: '',
    emphasis: true,
  });
  return workflow.complete();
}

async function deployStart(env = 'staging') {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'deploy',
    target: env,
    emphasis: true,
  });
  return workflow.start();
}

async function deployDone(env = 'staging') {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'deploy',
    target: env,
    emphasis: true,
  });
  return workflow.complete();
}

async function testStart(type = 'action') {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'test',
    target: type,
    emphasis: true,
  });
  return workflow.start();
}

async function testDone(type = 'action') {
  const workflow = await workflows.scriptLifecycleWorkflow({
    operation: 'test',
    target: type,
    emphasis: true,
  });
  return workflow.complete();
}

module.exports = {
  // Simple lifecycle functions
  buildStart,
  buildDone,
  deployStart,
  deployDone,
  testStart,
  testDone,

  // Direct access to domain layers (when needed)
  operations,
  utils,
  workflows,
};
