/**
 * Day 4: Extract Resolver Logic from Monolithic Resolver
 *
 * This script analyzes the current monolithic resolver (mesh-resolvers.js) and extracts
 * the reusable transformation logic that can be used in new source-specific resolvers.
 */

const fs = require('fs/promises');
const path = require('path');

/**
 * Parse and analyze the monolithic resolver file
 * @param {string} resolverPath - Path to the resolver file
 * @returns {Object} Analysis results
 */
async function analyzeMonolithicResolver(resolverPath) {
  const resolverContent = await fs.readFile(resolverPath, 'utf8');
  const lines = resolverContent.split('\n');

  const analysis = {
    totalLines: lines.length,
    sections: [],
    functions: [],
    utilities: [],
    configuration: [],
    transformations: [],
    apiCalls: [],
    caching: [],
    performance: [],
    reusableLogic: [],
  };

  let currentSection = null;
  let currentFunction = null;
  let inFunction = false;
  let braceLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect section headers
    if (
      trimmed.startsWith(
        '// ============================================================================='
      )
    ) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim().startsWith('//')) {
        currentSection = nextLine
          .trim()
          .replace(/^\/\/\s*/, '')
          .replace(/\s*\(.*\)$/, '');
        analysis.sections.push({
          name: currentSection,
          startLine: i + 1,
          content: [],
        });
      }
    }

    // Detect function definitions
    if (trimmed.includes('function ') || trimmed.includes('async function ')) {
      const match = trimmed.match(/(async\s+)?function\s+(\w+)/);
      if (match) {
        currentFunction = {
          name: match[2],
          async: !!match[1],
          startLine: i + 1,
          section: currentSection,
          lines: [],
          purpose: null,
        };
        inFunction = true;
        braceLevel = 0;
      }
    }

    // Track brace levels for function boundaries
    if (inFunction) {
      currentFunction.lines.push(line);
      braceLevel += (line.match(/\{/g) || []).length;
      braceLevel -= (line.match(/\}/g) || []).length;

      if (braceLevel === 0 && line.includes('}')) {
        currentFunction.endLine = i + 1;
        currentFunction.lineCount = currentFunction.lines.length;
        analysis.functions.push(currentFunction);
        inFunction = false;
        currentFunction = null;
      }
    }

    // Add line to current section
    if (currentSection && analysis.sections.length > 0) {
      analysis.sections[analysis.sections.length - 1].content.push(line);
    }
  }

  // Categorize functions by type
  analysis.functions.forEach((func) => {
    if (func.name.includes('OAuth') || func.name.includes('Auth')) {
      analysis.utilities.push(func);
    } else if (func.name.includes('fetch') || func.name.includes('get')) {
      analysis.apiCalls.push(func);
    } else if (func.name.includes('cache') || func.name.includes('Cache')) {
      analysis.caching.push(func);
    } else if (func.name.includes('enrich') || func.name.includes('transform')) {
      analysis.transformations.push(func);
    } else if (func.name.includes('performance') || func.name.includes('Performance')) {
      analysis.performance.push(func);
    }
  });

  return analysis;
}

/**
 * Extract reusable utility functions
 * @param {Object} analysis - Analysis results
 * @returns {Array} Reusable utilities
 */
function extractReusableUtilities(analysis) {
  const utilities = [];

  // OAuth utilities
  const oauthUtilities = analysis.functions.filter(
    (func) =>
      func.section === 'OAUTH UTILITIES (SHARED)' ||
      func.name.includes('OAuth') ||
      func.name.includes('Auth')
  );

  if (oauthUtilities.length > 0) {
    utilities.push({
      category: 'OAuth Authentication',
      description: 'OAuth 1.0 authentication with HMAC-SHA256 signatures',
      functions: oauthUtilities.map((func) => ({
        name: func.name,
        purpose: getOAuthFunctionPurpose(func.name),
        reusability: 'HIGH',
        complexity: func.lineCount > 50 ? 'HIGH' : 'MEDIUM',
        dependencies: ['crypto', 'TextEncoder', 'URLSearchParams'],
        usedBy: ['Products', 'Categories'],
      })),
      extractionPriority: 'HIGH',
      newLocation: 'src/mesh/json-schema/utilities/oauth.js',
    });
  }

  // Category utilities
  const categoryUtilities = analysis.functions.filter(
    (func) =>
      func.section === 'CATEGORY UTILITIES (SHARED)' ||
      func.name.includes('Category') ||
      func.name.includes('cache')
  );

  if (categoryUtilities.length > 0) {
    utilities.push({
      category: 'Category Caching',
      description: 'In-memory caching for category data with TTL',
      functions: categoryUtilities.map((func) => ({
        name: func.name,
        purpose: getCategoryFunctionPurpose(func.name),
        reusability: 'HIGH',
        complexity: 'LOW',
        dependencies: ['Map', 'Date'],
        usedBy: ['Categories', 'Products (for enrichment)'],
      })),
      extractionPriority: 'HIGH',
      newLocation: 'src/mesh/json-schema/utilities/caching.js',
    });
  }

  // Data enrichment utilities
  const enrichmentUtilities = analysis.functions.filter(
    (func) =>
      func.name.includes('enrich') ||
      func.name.includes('extract') ||
      func.name.includes('Identifiers')
  );

  if (enrichmentUtilities.length > 0) {
    utilities.push({
      category: 'Data Enrichment',
      description: 'Logic to combine and enrich product data with categories and inventory',
      functions: enrichmentUtilities.map((func) => ({
        name: func.name,
        purpose: getEnrichmentFunctionPurpose(func.name),
        reusability: 'MEDIUM',
        complexity: 'MEDIUM',
        dependencies: ['Array', 'Object'],
        usedBy: ['Products (main enrichment logic)'],
      })),
      extractionPriority: 'MEDIUM',
      newLocation: 'src/mesh/json-schema/utilities/enrichment.js',
    });
  }

  // Performance tracking utilities
  const performanceUtilities = analysis.functions.filter(
    (func) =>
      func.name.includes('performance') ||
      func.name.includes('Performance') ||
      func.name.includes('calculate') ||
      func.name.includes('initialize')
  );

  if (performanceUtilities.length > 0) {
    utilities.push({
      category: 'Performance Tracking',
      description: 'Comprehensive performance metrics and tracking',
      functions: performanceUtilities.map((func) => ({
        name: func.name,
        purpose: getPerformanceFunctionPurpose(func.name),
        reusability: 'HIGH',
        complexity: 'LOW',
        dependencies: ['Date'],
        usedBy: ['All resolvers'],
      })),
      extractionPriority: 'MEDIUM',
      newLocation: 'src/mesh/json-schema/utilities/performance.js',
    });
  }

  return utilities;
}

/**
 * Extract source-specific logic patterns
 * @param {Object} analysis - Analysis results
 * @returns {Array} Source-specific patterns
 */
function extractSourcePatterns(analysis) {
  const patterns = [];

  // Products source pattern
  const productsFunctions = analysis.functions.filter(
    (func) => func.name.includes('fetchAllProducts') || func.section === 'PRODUCT FETCHING'
  );

  if (productsFunctions.length > 0) {
    patterns.push({
      source: 'Products',
      authentication: 'OAuth 1.0',
      pattern: 'Paginated API fetching with OAuth authentication',
      functions: productsFunctions.map((func) => func.name),
      keyLogic: [
        'OAuth header generation for each request',
        'Paginated fetching with configurable page size',
        'Field selection via query parameters',
        'Error handling for API failures',
        'Response validation and parsing',
      ],
      extractionTarget: 'src/mesh/json-schema/resolvers/products.js',
      complexity: 'MEDIUM',
      dependencies: ['OAuth utilities', 'HTTP client'],
    });
  }

  // Categories source pattern
  const categoriesFunctions = analysis.functions.filter(
    (func) => func.name.includes('fetchCategoriesData') || func.section === 'CATEGORY FETCHING'
  );

  if (categoriesFunctions.length > 0) {
    patterns.push({
      source: 'Categories',
      authentication: 'OAuth 1.0',
      pattern: 'Individual category fetching with caching',
      functions: categoriesFunctions.map((func) => func.name),
      keyLogic: [
        'Cache-first lookup with TTL',
        'Batch processing for uncached categories',
        'OAuth authentication for each request',
        'Individual category API calls',
        'Cache population after successful fetch',
      ],
      extractionTarget: 'src/mesh/json-schema/resolvers/categories.js',
      complexity: 'MEDIUM',
      dependencies: ['OAuth utilities', 'Caching utilities', 'HTTP client'],
    });
  }

  // Inventory source pattern
  const inventoryFunctions = analysis.functions.filter(
    (func) =>
      func.name.includes('fetchInventoryData') ||
      func.name.includes('getAdminToken') ||
      func.section === 'INVENTORY FETCHING'
  );

  if (inventoryFunctions.length > 0) {
    patterns.push({
      source: 'Inventory',
      authentication: 'Admin Token',
      pattern: 'Batch inventory fetching with admin token',
      functions: inventoryFunctions.map((func) => func.name),
      keyLogic: [
        'Admin token extraction from headers',
        'Batch processing for multiple SKUs',
        'Search criteria with IN filter',
        'Bearer token authentication',
        'Inventory mapping by SKU',
      ],
      extractionTarget: 'src/mesh/json-schema/resolvers/inventory.js',
      complexity: 'LOW',
      dependencies: ['HTTP client', 'Admin token utilities'],
    });
  }

  return patterns;
}

/**
 * Extract main resolver orchestration logic
 * @param {Object} analysis - Analysis results
 * @returns {Object} Orchestration logic
 */
function extractOrchestrationLogic(analysis) {
  const resolverFunction = analysis.functions.find(
    (func) => func.name === 'resolve' || func.section === 'GRAPHQL RESOLVER'
  );

  if (!resolverFunction) {
    return null;
  }

  return {
    name: 'Main Resolver Orchestration',
    description: 'Main GraphQL resolver that orchestrates all data fetching and enrichment',
    steps: [
      {
        step: 1,
        action: 'Initialize performance tracking',
        pattern: 'const performance = initializePerformanceTracking()',
        reusability: 'HIGH',
      },
      {
        step: 2,
        action: 'Extract authentication credentials',
        pattern: 'extractOAuthCredentials(context) + context.adminToken',
        reusability: 'HIGH',
      },
      {
        step: 3,
        action: 'Fetch all products',
        pattern: 'await fetchAllProducts(context, pageSize, maxPages)',
        reusability: 'MEDIUM',
      },
      {
        step: 4,
        action: 'Extract identifiers',
        pattern: 'extractProductIdentifiers(products)',
        reusability: 'HIGH',
      },
      {
        step: 5,
        action: 'Parallel data fetching',
        pattern: 'Promise.all([fetchCategories, fetchInventory])',
        reusability: 'HIGH',
      },
      {
        step: 6,
        action: 'Enrich products',
        pattern: 'enrichProductsWithData(products, categories, inventory)',
        reusability: 'HIGH',
      },
      {
        step: 7,
        action: 'Calculate performance metrics',
        pattern: 'calculatePerformanceMetrics(performance, ...)',
        reusability: 'HIGH',
      },
      {
        step: 8,
        action: 'Return structured response',
        pattern: 'return { products, total_count, message, status, performance }',
        reusability: 'HIGH',
      },
    ],
    complexity: 'HIGH',
    newApproach: 'Source-specific resolvers with shared utilities',
  };
}

/**
 * Generate extraction recommendations
 * @param {Object} utilities - Reusable utilities
 * @param {Array} patterns - Source patterns
 * @param {Object} orchestration - Orchestration logic
 * @returns {Object} Recommendations
 */
function generateExtractionRecommendations(utilities, patterns) {
  return {
    phase2Implementation: {
      approach: 'Extract utilities first, then create source-specific resolvers',
      priority: 'HIGH',
      timeline: 'Days 5-7',
    },
    utilityExtraction: {
      highPriority: utilities.filter((u) => u.extractionPriority === 'HIGH'),
      mediumPriority: utilities.filter((u) => u.extractionPriority === 'MEDIUM'),
      totalFunctions: utilities.reduce((sum, u) => sum + u.functions.length, 0),
    },
    sourceResolvers: {
      count: patterns.length,
      averageComplexity:
        patterns.reduce(
          (sum, p) => sum + (p.complexity === 'HIGH' ? 3 : p.complexity === 'MEDIUM' ? 2 : 1),
          0
        ) / patterns.length,
      sharedDependencies: [
        'OAuth utilities',
        'HTTP client',
        'Performance tracking',
        'Error handling',
      ],
    },
    orchestrationChanges: {
      currentApproach: 'Single monolithic resolver',
      newApproach: 'Source-specific resolvers with shared utilities',
      benefitsExpected: [
        'Improved maintainability',
        'Better separation of concerns',
        'Easier testing',
        'Clearer configuration',
        'Source-specific error handling',
      ],
    },
    migrationStrategy: {
      step1: 'Extract shared utilities (OAuth, caching, performance)',
      step2: 'Create products resolver with extracted utilities',
      step3: 'Create categories resolver with caching',
      step4: 'Create inventory resolver with admin token auth',
      step5: 'Update mesh configuration to use JSON Schema sources',
      step6: 'Test and validate parity with monolithic resolver',
    },
  };
}

/**
 * Save extraction analysis to files
 * @param {Object} analysis - Complete analysis
 * @param {Object} utilities - Reusable utilities
 * @param {Array} patterns - Source patterns
 * @param {Object} orchestration - Orchestration logic
 * @param {Object} recommendations - Recommendations
 */
async function saveExtractionAnalysis(
  analysis,
  utilities,
  patterns,
  orchestration,
  recommendations
) {
  const outputDir = path.join(process.cwd(), 'src', 'mesh', 'json-schema', 'analysis');

  // Ensure directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Save complete analysis
  await fs.writeFile(
    path.join(outputDir, 'monolithic-resolver-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );

  // Save reusable utilities
  await fs.writeFile(
    path.join(outputDir, 'reusable-utilities.json'),
    JSON.stringify(utilities, null, 2)
  );

  // Save source patterns
  await fs.writeFile(
    path.join(outputDir, 'source-patterns.json'),
    JSON.stringify(patterns, null, 2)
  );

  // Save orchestration logic
  await fs.writeFile(
    path.join(outputDir, 'orchestration-logic.json'),
    JSON.stringify(orchestration, null, 2)
  );

  // Save recommendations
  await fs.writeFile(
    path.join(outputDir, 'extraction-recommendations.json'),
    JSON.stringify(recommendations, null, 2)
  );

  // Save summary report
  const summary = {
    totalAnalysis: {
      linesAnalyzed: analysis.totalLines,
      sectionsFound: analysis.sections.length,
      functionsFound: analysis.functions.length,
      utilitiesExtracted: utilities.length,
      sourcePatternsFound: patterns.length,
    },
    extractionTargets: {
      utilities: utilities.map((u) => ({
        category: u.category,
        priority: u.extractionPriority,
        location: u.newLocation,
      })),
      resolvers: patterns.map((p) => ({
        source: p.source,
        target: p.extractionTarget,
        complexity: p.complexity,
      })),
    },
    nextSteps: recommendations.migrationStrategy,
    generatedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(outputDir, 'extraction-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n✅ Extraction analysis saved to ${outputDir}/`);
  console.log('📁 Files created:');
  console.log('   - monolithic-resolver-analysis.json (complete analysis)');
  console.log('   - reusable-utilities.json (utilities to extract)');
  console.log('   - source-patterns.json (source-specific patterns)');
  console.log('   - orchestration-logic.json (main resolver logic)');
  console.log('   - extraction-recommendations.json (migration recommendations)');
  console.log('   - extraction-summary.json (executive summary)');
}

// Helper functions for categorizing function purposes
function getOAuthFunctionPurpose(name) {
  const purposes = {
    percentEncode: 'URL encoding for OAuth parameters',
    generateHmacSignature: 'HMAC-SHA256 signature generation',
    createOAuthHeader: 'OAuth 1.0 authorization header creation',
    extractOAuthCredentials: 'OAuth credentials extraction from context',
  };
  return purposes[name] || 'OAuth authentication utility';
}

function getCategoryFunctionPurpose(name) {
  const purposes = {
    getCachedCategory: 'Retrieve category from cache with TTL check',
    cacheCategory: 'Store category in cache with timestamp',
    buildCategoryMapFromCache: 'Build category map from cached data',
  };
  return purposes[name] || 'Category caching utility';
}

function getEnrichmentFunctionPurpose(name) {
  const purposes = {
    extractProductIdentifiers: 'Extract category IDs and SKUs from products',
    enrichProductsWithData: 'Combine products with category and inventory data',
  };
  return purposes[name] || 'Data enrichment utility';
}

function getPerformanceFunctionPurpose(name) {
  const purposes = {
    initializePerformanceTracking: 'Initialize performance metrics object',
    calculatePerformanceMetrics: 'Calculate final performance metrics',
  };
  return purposes[name] || 'Performance tracking utility';
}

/**
 * Main extraction function
 */
async function main() {
  try {
    console.log('🔍 Day 4: Starting resolver logic extraction...\n');

    const resolverPath = path.join(process.cwd(), 'mesh-resolvers.js');

    // Step 1: Analyze monolithic resolver
    console.log('📊 Analyzing monolithic resolver...');
    const analysis = await analyzeMonolithicResolver(resolverPath);

    console.log(`   - Total lines: ${analysis.totalLines}`);
    console.log(`   - Sections found: ${analysis.sections.length}`);
    console.log(`   - Functions found: ${analysis.functions.length}`);

    // Step 2: Extract reusable utilities
    console.log('\n🔧 Extracting reusable utilities...');
    const utilities = extractReusableUtilities(analysis);

    console.log(`   - Utility categories: ${utilities.length}`);
    utilities.forEach((u) => {
      console.log(
        `     - ${u.category}: ${u.functions.length} functions (${u.extractionPriority} priority)`
      );
    });

    // Step 3: Extract source patterns
    console.log('\n📋 Extracting source-specific patterns...');
    const patterns = extractSourcePatterns(analysis);

    console.log(`   - Source patterns: ${patterns.length}`);
    patterns.forEach((p) => {
      console.log(
        `     - ${p.source}: ${p.functions.length} functions (${p.complexity} complexity)`
      );
    });

    // Step 4: Extract orchestration logic
    console.log('\n🎯 Extracting orchestration logic...');
    const orchestration = extractOrchestrationLogic(analysis);

    if (orchestration) {
      console.log(`   - Main resolver steps: ${orchestration.steps.length}`);
      console.log(`   - Orchestration complexity: ${orchestration.complexity}`);
    }

    // Step 5: Generate recommendations
    console.log('\n💡 Generating extraction recommendations...');
    const recommendations = generateExtractionRecommendations(utilities, patterns);

    console.log(
      `   - High priority utilities: ${recommendations.utilityExtraction.highPriority.length}`
    );
    console.log(
      `   - Medium priority utilities: ${recommendations.utilityExtraction.mediumPriority.length}`
    );
    console.log(`   - Source resolvers to create: ${recommendations.sourceResolvers.count}`);

    // Step 6: Save analysis
    await saveExtractionAnalysis(analysis, utilities, patterns, orchestration, recommendations);

    console.log('\n🎉 Day 4 completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Analyzed ${analysis.totalLines} lines of resolver code`);
    console.log(`   - Found ${utilities.length} reusable utility categories`);
    console.log(`   - Identified ${patterns.length} source-specific patterns`);
    console.log(`   - Documented ${orchestration?.steps.length || 0} orchestration steps`);

    console.log('\nNext steps:');
    console.log('   - Day 5: Create focused product-enrichment.js resolver');
    console.log('   - Day 6: Create category-integration.js resolver');
    console.log('   - Day 7: Create inventory-integration.js resolver');
  } catch (error) {
    console.error('❌ Day 4 failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeMonolithicResolver,
  extractReusableUtilities,
  extractSourcePatterns,
  extractOrchestrationLogic,
  generateExtractionRecommendations,
};
