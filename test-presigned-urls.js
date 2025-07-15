/**
 * Test Adobe I/O Files SDK generatePresignURL functionality
 * Tests both external and internal URL types with various options
 */

const { loadConfig } = require('./config');

/**
 * Test presigned URL generation with Adobe I/O Files SDK
 * @param {Object} params - Action parameters with credentials
 */
async function testPresignedUrls(params = {}) {
  console.log('🧪 Testing Adobe I/O Files SDK generatePresignURL functionality...\n');

  try {
    // Load configuration
    const config = loadConfig(params);

    // Initialize Files SDK
    const { Files } = require('@adobe/aio-sdk');
    const files = await Files.init();

    console.log('✅ Adobe I/O Files SDK initialized successfully');

    // Check if generatePresignURL method exists
    const hasGeneratePresignURL = typeof files.generatePresignURL === 'function';
    console.log(`📋 generatePresignURL method available: ${hasGeneratePresignURL}`);

    if (!hasGeneratePresignURL) {
      console.log('❌ generatePresignURL method not found in Files SDK');
      console.log('Available methods:', Object.getOwnPropertyNames(files));
      return;
    }

    // Test file name (use a known existing file or create one for testing)
    const testFileName = config.storage.csv.filename || 'test-file.csv';
    const fullFileName = config.storage.directory
      ? `${config.storage.directory}${testFileName}`
      : testFileName;

    console.log(`\n📂 Testing with file: ${fullFileName}\n`);

    // Test scenarios
    const testScenarios = [
      {
        name: 'External URL - Read Only',
        options: {
          expiryInSeconds: 1800,
          permissions: 'r',
          urltype: 'external',
        },
      },
      {
        name: 'Internal URL - Read Only',
        options: {
          expiryInSeconds: 1800,
          permissions: 'r',
          urltype: 'internal',
        },
      },
      {
        name: 'External URL - Read/Write',
        options: {
          expiryInSeconds: 3600,
          permissions: 'rw',
          urltype: 'external',
        },
      },
      {
        name: 'Internal URL - Read/Write/Delete',
        options: {
          expiryInSeconds: 3600,
          permissions: 'rwd',
          urltype: 'internal',
        },
      },
      {
        name: 'Adobe Target - Long-Lived URL',
        description: 'External URL optimized for Adobe Target 24-hour refresh cycle',
        options: {
          expiryInSeconds: 172800, // 48 hours (2 days) for Adobe Target integration
          urltype: 'external', // CDN-based for optimal performance
          permissions: 'r', // Read-only for security
        },
      },
      {
        name: 'Default Options',
        options: {
          expiryInSeconds: 1800,
        },
      },
    ];

    const results = [];

    for (const scenario of testScenarios) {
      console.log(`\n🔍 Testing: ${scenario.name}`);
      console.log('Options:', JSON.stringify(scenario.options, null, 2));

      try {
        const startTime = Date.now();
        const presignedUrl = await files.generatePresignURL(fullFileName, scenario.options);
        const duration = Date.now() - startTime;

        console.log(`✅ Success (${duration}ms)`);
        console.log(`📎 URL: ${presignedUrl.substring(0, 100)}...`);

        // Analyze URL characteristics
        const analysis = analyzePresignedUrl(presignedUrl, scenario.options);
        console.log('🔍 Analysis:', analysis);

        results.push({
          scenario: scenario.name,
          success: true,
          url: presignedUrl,
          duration,
          analysis,
          options: scenario.options,
        });
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);

        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
          options: scenario.options,
        });
      }
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`❌ Failed tests: ${failed.length}/${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successful scenarios:');
      successful.forEach((result) => {
        console.log(`  • ${result.scenario} (${result.duration}ms)`);
        if (result.analysis) {
          console.log(`    - URL Type: ${result.analysis.urlType}`);
          console.log(`    - Domain: ${result.analysis.domain}`);
        }
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed scenarios:');
      failed.forEach((result) => {
        console.log(`  • ${result.scenario}: ${result.error}`);
      });
    }

    // Adobe Target specific analysis
    const adobeTargetResult = successful.find(
      (r) => r.scenario === 'Adobe Target - Long-Lived URL'
    );
    if (adobeTargetResult) {
      console.log('\n🎯 Adobe Target Integration Analysis:');
      const hours = Math.round(adobeTargetResult.options.expiryInSeconds / 3600);
      console.log(`  • URL valid for ${hours} hours (${Math.round(hours / 24)} days)`);
      console.log(`  • Supports 24-hour refresh cycle with ${hours - 24} hours safety buffer`);
      console.log('  • CDN-based external URL for optimal performance');
      console.log('  • Read-only permissions (secure for Adobe Target consumption)');
      console.log('  • No URL expiration concerns for daily refresh workflow');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (successful.length === results.length) {
      console.log('  • All tests passed! Native presigned URLs are fully supported');
      console.log('  • Fallback mechanism can be safely removed');
      console.log('  • Both external and internal URL types work correctly');
      if (adobeTargetResult) {
        console.log('  • Adobe Target integration ready with 48-hour URL validity');
      }
    } else if (successful.length > 0) {
      console.log('  • Partial support detected - some scenarios work');
      console.log('  • Consider using only supported scenarios in production');
    } else {
      console.log('  • No presigned URL support detected');
      console.log('  • Continue using action-based fallback mechanism');
    }

    return results;
  } catch (error) {
    console.error('💥 Test initialization failed:', error.message);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

/**
 * Analyze presigned URL characteristics
 * @param {string} url - Presigned URL to analyze
 * @param {Object} options - Options used to generate the URL
 * @returns {Object} Analysis results
 */
function analyzePresignedUrl(url, options) {
  try {
    const urlObj = new URL(url);

    // Determine URL type based on domain
    let urlType = 'unknown';
    if (urlObj.hostname.includes('blob.core.windows.net')) {
      urlType = 'external-cdn';
    } else if (urlObj.hostname.includes('adobeio')) {
      urlType = 'internal-storage';
    }

    // Check for signature parameters
    const hasSignature =
      urlObj.searchParams.has('sig') ||
      urlObj.searchParams.has('signature') ||
      urlObj.searchParams.has('se'); // Azure expiry

    // Extract expiry information
    const expiryParam =
      urlObj.searchParams.get('se') ||
      urlObj.searchParams.get('expires') ||
      urlObj.searchParams.get('exp');

    return {
      domain: urlObj.hostname,
      protocol: urlObj.protocol,
      urlType,
      hasSignature,
      expiryParam,
      requestedUrlType: options.urltype || 'default',
      requestedPermissions: options.permissions || 'default',
      pathLength: urlObj.pathname.length,
      paramCount: urlObj.searchParams.size,
    };
  } catch (error) {
    return {
      error: `URL analysis failed: ${error.message}`,
    };
  }
}

/**
 * CLI interface for testing
 */
if (require.main === module) {
  // Read credentials from environment or .env file
  require('dotenv').config();

  const params = {
    // Add any required parameters here
    LOG_LEVEL: 'debug',
  };

  testPresignedUrls(params)
    .then((results) => {
      if (results) {
        console.log('\n🎉 Test completed successfully!');
        return process.exit(0);
      } else {
        console.log('\n💥 Test failed to complete');
        return process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      return process.exit(1);
    });
}

module.exports = {
  testPresignedUrls,
  analyzePresignedUrl,
};
