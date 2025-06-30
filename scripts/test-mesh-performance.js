#!/usr/bin/env node

/**
 * Mesh Performance Comparison Script
 * Simple, focused performance testing for REST API vs API Mesh
 */

const ora = require('ora');

const { buildRuntimeUrl } = require('../src/core/url');

/**
 * Test an action and measure performance
 * @param {string} actionName - Name of the action to test
 * @returns {Promise<Object>} Performance results
 */
async function testActionPerformance(actionName) {
  const spinner = ora(`Testing ${actionName} performance...`).start();

  try {
    // Use staging environment for testing unless explicitly set to production
    const envParams = {
      NODE_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
    };
    const url = buildRuntimeUrl(actionName, null, envParams);

    console.log(`   URL: ${url}`); // Debug URL

    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    spinner.succeed(`${actionName} completed in ${duration}ms`);

    return {
      action: actionName,
      duration,
      success: true,
      data: {
        message: data.message,
        steps: data.steps || [],
        performance: data.performance || {},
        downloadUrl: data.downloadUrl,
        storage: data.storage,
      },
    };
  } catch (error) {
    spinner.fail(`${actionName} failed: ${error.message}`);
    return {
      action: actionName,
      duration: -1,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run mesh performance comparison
 */
async function runMeshComparison() {
  // Default to staging for testing if not explicitly set
  const testEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

  console.log(`\n🚀 Mesh Performance Comparison - ${testEnvironment} Environment\n`);

  const actions = [
    { name: 'get-products', label: 'REST API' },
    { name: 'get-products-mesh', label: 'API Mesh' },
  ];

  const results = [];

  // Test each action
  for (const action of actions) {
    const result = await testActionPerformance(action.name);
    result.label = action.label;
    results.push(result);
  }

  // Performance comparison
  console.log('\n📊 Performance Comparison Results:\n');

  const successfulResults = results.filter((r) => r.success);

  if (successfulResults.length === 2) {
    const [rest, mesh] = successfulResults;
    const difference = mesh.duration - rest.duration;
    const percentDifference = ((difference / rest.duration) * 100).toFixed(1);

    console.log('✅ Both actions completed successfully\n');

    console.log('⏱️  **Execution Times:**');
    console.log(`   REST API: ${rest.duration}ms`);
    console.log(`   API Mesh: ${mesh.duration}ms`);
    console.log(
      `   Difference: ${difference > 0 ? '+' : ''}${difference}ms (${percentDifference > 0 ? '+' : ''}${percentDifference}%)\n`
    );

    // Compare product counts
    const restProducts = rest.data.performance?.processedProducts || 0;
    const meshProducts = mesh.data.performance?.processedProducts || 0;

    console.log('📦 **Product Processing:**');
    console.log(`   REST API: ${restProducts} products`);
    console.log(`   API Mesh: ${meshProducts} products`);
    if (restProducts === meshProducts) {
      console.log('   ✅ Same product count - data parity confirmed\n');
    } else {
      console.log('   ⚠️  Different product counts detected\n');
    }

    // Compare file sizes if available
    if (rest.data.storage && mesh.data.storage) {
      console.log('📁 **File Output:**');
      console.log(`   REST API: ${rest.data.storage.properties?.size || 'N/A'}`);
      console.log(`   API Mesh: ${mesh.data.storage.properties?.size || 'N/A'}\n`);
    }

    // Performance insight
    if (difference > 0) {
      console.log(`🔍 **Analysis:** API Mesh is ${percentDifference}% slower than REST API`);
      if (Math.abs(parseFloat(percentDifference)) > 20) {
        console.log(
          '   ⚠️  Significant performance difference detected - optimization recommended'
        );
      } else {
        console.log('   ✅ Performance difference within acceptable range');
      }
    } else {
      console.log(
        `🚀 **Analysis:** API Mesh is ${Math.abs(percentDifference)}% faster than REST API!`
      );
    }
  } else {
    console.log('❌ One or more actions failed - cannot compare performance\n');
    results.forEach((result) => {
      if (!result.success) {
        console.log(`   ${result.label}: ${result.error}`);
      }
    });
  }

  return results;
}

// Run comparison if called directly
if (require.main === module) {
  runMeshComparison().catch((error) => {
    console.error('\n❌ Performance comparison failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runMeshComparison,
  testActionPerformance,
};
