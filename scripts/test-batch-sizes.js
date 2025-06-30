#!/usr/bin/env node

/**
 * Batch Size Performance Testing
 * Test different pageSize values for mesh resolver optimization
 */

const ora = require('ora');

const { testActionPerformance } = require('./test-mesh-performance');

/**
 * Test an action with specific parameters
 * @param {string} actionName - Name of the action to test
 * @param {Object} params - Parameters to pass to the action
 * @returns {Promise<Object>} Performance results
 */
async function testActionWithParams(actionName, params = {}) {
  const { buildRuntimeUrl } = require('../src/core/url');

  const spinner = ora(`Testing ${actionName} with params...`).start();

  try {
    // Build URL with query parameters
    const envParams = {
      NODE_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
    };
    const baseUrl = buildRuntimeUrl(actionName, null, envParams);

    // Add pageSize parameter for mesh actions
    const queryParams = new URLSearchParams(params);
    const url = `${baseUrl}?${queryParams.toString()}`;

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
      params,
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
      params,
    };
  }
}

/**
 * Test different batch sizes for mesh performance
 */
async function testBatchSizes() {
  console.log('\n🔬 Batch Size Performance Testing\n');

  const batchSizes = [50, 100, 150, 200, 300];
  const results = [];

  // Test baseline REST API performance first
  console.log('📍 Testing REST API baseline...');
  const restResult = await testActionPerformance('get-products', {});
  console.log(`📍 REST API Baseline: ${restResult.duration}ms\n`);

  // Test each batch size for mesh
  for (const batchSize of batchSizes) {
    console.log(`🔬 Testing mesh with batch size: ${batchSize}`);

    // Use pageSize parameter to test different batch sizes
    const result = await testActionWithParams('get-products-mesh', { pageSize: batchSize });

    if (result.success) {
      result.batchSize = batchSize;
      results.push(result);

      const difference = result.duration - restResult.duration;
      const percentChange = ((difference / restResult.duration) * 100).toFixed(1);

      console.log(
        `   ✅ ${result.duration}ms (${percentChange > 0 ? '+' : ''}${percentChange}% vs REST)`
      );
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      results.push(result);
    }
  }

  // Analysis
  console.log('\n📊 Batch Size Analysis:\n');

  const successfulResults = results.filter((r) => r.success && r.duration > 0);
  if (successfulResults.length > 0) {
    // Find best performance
    const best = successfulResults.reduce((prev, curr) =>
      curr.duration < prev.duration ? curr : prev
    );

    console.log(`🏆 Best Performance: Batch size ${best.batchSize} (${best.duration}ms)`);

    const improvementVsRest = (
      ((restResult.duration - best.duration) / restResult.duration) *
      100
    ).toFixed(1);
    if (improvementVsRest > 0) {
      console.log(`🚀 Improvement over REST: ${improvementVsRest}%`);
    } else {
      console.log(`📉 Still slower than REST: ${Math.abs(improvementVsRest)}%`);
    }

    // Show all results
    console.log('\n📋 Complete Results:');
    console.log(`   REST API (baseline): ${restResult.duration}ms`);
    successfulResults.forEach((result) => {
      const vsRest = (
        ((result.duration - restResult.duration) / restResult.duration) *
        100
      ).toFixed(1);
      const products = result.data.performance?.processedProducts || 'N/A';
      console.log(
        `   Batch ${result.batchSize}: ${result.duration}ms (${vsRest > 0 ? '+' : ''}${vsRest}%) - ${products} products`
      );
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (best.duration < restResult.duration) {
      console.log(`   ✅ Use batch size ${best.batchSize} for optimal performance`);
    } else {
      console.log('   ⚠️  All mesh configurations slower than REST API');
      console.log('   📝 Consider investigating other optimization approaches');
    }
  } else {
    console.log('❌ No successful tests - all batch sizes failed');
  }

  return results;
}

// Run test if called directly
if (require.main === module) {
  testBatchSizes().catch((error) => {
    console.error('\n❌ Batch size testing failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testBatchSizes,
};
