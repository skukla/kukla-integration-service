/**
 * App Audit Test - Confidence Scoring Sub-module
 * Confidence calculation utilities for audit rules
 */

// Confidence Scoring Workflows

/**
 * Calculate confidence scores for validation results
 * @purpose Analyze confidence levels of audit rule validation
 * @param {Object} validationResults - Validation results
 * @param {Object} config - Configuration
 * @returns {Promise<Object>} Confidence analysis
 * @usedBy app-audit-test.js auditTestWithAllComponents
 */
async function calculateConfidenceScores(validationResults, config) {
  const confidenceAnalysis = {
    overall: 0,
    byTier: {
      tier1: 0,
      tier2: 0,
      tier3: 0,
    },
    details: [],
  };

  // Calculate confidence for each validation result
  for (const detail of validationResults.details) {
    const confidence = calculateRuleConfidence(detail, config);
    confidenceAnalysis.details.push({
      ...detail,
      confidence,
    });

    // Update tier-specific confidence
    if (confidenceAnalysis.byTier[detail.type] !== undefined) {
      confidenceAnalysis.byTier[detail.type] = Math.max(
        confidenceAnalysis.byTier[detail.type],
        confidence
      );
    }
  }

  // Calculate overall confidence
  const tierConfidences = Object.values(confidenceAnalysis.byTier);
  confidenceAnalysis.overall =
    tierConfidences.reduce((sum, conf) => sum + conf, 0) / tierConfidences.length;

  return confidenceAnalysis;
}

// Confidence Scoring Operations

function calculateRuleConfidence(validationDetail, config) {
  const baseConfidence = validationDetail.passed ? 0.9 : 0.1;
  const tierWeighting = getTierWeighting(validationDetail.type, config);

  return baseConfidence * tierWeighting;
}

function getTierWeighting(tier, config) {
  const weightings = config.auditTest.confidence.weightings;

  return weightings[tier] || 0.5;
}

module.exports = {
  calculateConfidenceScores,
};
