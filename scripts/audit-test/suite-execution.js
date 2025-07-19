/**
 * App Audit Test - Suite Execution Sub-module
 * Test suite orchestration utilities
 */

// Suite Execution Workflows

/**
 * Execute suite orchestration for confidence results
 * @purpose Orchestrate and finalize test suite execution
 * @param {Object} confidenceResults - Confidence analysis results
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Orchestration results
 * @usedBy app-audit-test.js auditTestWithAllComponents
 */
async function executeSuiteOrchestration(confidenceResults, options) {
  const orchestrationResults = {
    success: true,
    passed: 0,
    failed: 0,
    confidence: confidenceResults.overall,
    summary: {},
  };

  // Determine success based on confidence threshold
  const threshold = options.confidenceThreshold || 0.7;
  orchestrationResults.success = confidenceResults.overall >= threshold;

  // Count passed/failed based on confidence details
  for (const detail of confidenceResults.details) {
    if (detail.passed) {
      orchestrationResults.passed++;
    } else {
      orchestrationResults.failed++;
    }
  }

  // Generate summary
  orchestrationResults.summary = {
    totalTests: orchestrationResults.passed + orchestrationResults.failed,
    passRate:
      orchestrationResults.passed / (orchestrationResults.passed + orchestrationResults.failed),
    confidenceScore: confidenceResults.overall,
    tier1Confidence: confidenceResults.byTier.tier1,
    tier2Confidence: confidenceResults.byTier.tier2,
    tier3Confidence: confidenceResults.byTier.tier3,
  };

  if (options.verbose) {
    displaySuiteResults(orchestrationResults);
  }

  return orchestrationResults;
}

// Suite Execution Operations

function displaySuiteResults(results) {
  console.log('\n📊 Test Suite Results:');
  console.log(`   Total Tests: ${results.summary.totalTests}`);
  console.log(`   Pass Rate: ${(results.summary.passRate * 100).toFixed(1)}%`);
  console.log(`   Overall Confidence: ${(results.confidence * 100).toFixed(1)}%`);
  console.log(`   Tier 1 Confidence: ${(results.summary.tier1Confidence * 100).toFixed(1)}%`);
  console.log(`   Tier 2 Confidence: ${(results.summary.tier2Confidence * 100).toFixed(1)}%`);
  console.log(`   Tier 3 Confidence: ${(results.summary.tier3Confidence * 100).toFixed(1)}%`);
  console.log(`   Status: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
}

module.exports = {
  executeSuiteOrchestration,
};
