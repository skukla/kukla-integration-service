#!/usr/bin/env node

/**
 * Test Presigned URL Functionality via Storage System
 *
 * Tests presigned URL generation through the existing storage workflows
 * instead of directly initializing the Adobe I/O Files SDK.
 */

const { loadConfig } = require('./config');
const { generateFileAccessUrl } = require('./src/files/utils/access-patterns');
const { initializeStorage } = require('./src/files/workflows/file-management');

/**
 * Process access result and log details
 */
function processAccessResult(accessResult, pattern, duration) {
  if (accessResult.success) {
    console.log(`✅ Success (${duration}ms)`);
    console.log(`📎 URL: ${accessResult.url.substring(0, 100)}...`);
    console.log(`🔧 Method: ${accessResult.method}`);
    console.log(`🌐 URL Type: ${accessResult.urlType}`);

    if (accessResult.expiresAt) {
      const expiresIn = Math.round((new Date(accessResult.expiresAt) - new Date()) / 1000);
      console.log(`⏰ Expires in: ${expiresIn} seconds (${Math.round(expiresIn / 3600)} hours)`);
    } else {
      console.log('⏰ Expiration: Never (action URL)');
    }

    return {
      pattern: pattern.name,
      useCase: pattern.useCase,
      success: true,
      method: accessResult.method,
      urlType: accessResult.urlType,
      hasExpiration: !!accessResult.expiresAt,
      duration,
      url: accessResult.url,
    };
  } else {
    console.log(`❌ Failed: ${accessResult.error?.message || 'Unknown error'}`);
    return {
      pattern: pattern.name,
      useCase: pattern.useCase,
      success: false,
      error: accessResult.error?.message,
      duration,
    };
  }
}

/**
 * Test presigned URL functionality through storage system
 */
async function testPresignedUrlFunctionality() {
  console.log('🧪 Testing Presigned URL Functionality via Storage System...\n');

  try {
    // Load configuration
    const config = loadConfig();
    console.log('✅ Configuration loaded successfully');

    // Check if presigned URLs are enabled
    const presignedEnabled = config.storage?.presignedUrls?.enabled;
    console.log(`📋 Presigned URLs enabled in config: ${presignedEnabled}`);

    if (!presignedEnabled) {
      console.log('⚠️  Presigned URLs are disabled in configuration');
      console.log('Enable them in config/domains/files.js to test functionality');
      return;
    }

    // Test with a known file (products.csv should exist from recent tests)
    const testFileName = config.storage.csv.filename || 'products.csv';
    console.log(`📂 Testing with file: ${testFileName}\n`);

    // Test different access patterns
    const testPatterns = [
      {
        name: 'User Access (Download Action)',
        useCase: 'user',
        description: 'Default user access via action URL',
      },
      {
        name: 'Adobe Target Access (Presigned URL)',
        useCase: 'adobeTarget',
        description: 'Adobe Target requires presigned URLs with long expiration',
      },
      {
        name: 'Unknown System (Fallback Pattern)',
        useCase: 'unknownSystem',
        description: 'Unknown system using fallback presigned URL pattern',
      },
    ];

    const results = [];

    for (const pattern of testPatterns) {
      console.log(`\n🔍 Testing: ${pattern.name}`);
      console.log(`Use Case: ${pattern.useCase}`);
      console.log(`Description: ${pattern.description}`);

      try {
        const startTime = Date.now();

        // Test access URL generation
        const accessResult = await generateFileAccessUrl(
          testFileName,
          pattern.useCase,
          config,
          {} // Empty params for testing
        );

        const duration = Date.now() - startTime;

        const result = processAccessResult(accessResult, pattern, duration);
        results.push(result);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.push({
          pattern: pattern.name,
          useCase: pattern.useCase,
          success: false,
          error: error.message,
          duration: 0,
        });
      }
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(60));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    console.log(`❌ Failed tests: ${failed.length}/${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successful patterns:');
      successful.forEach((result) => {
        console.log(`  • ${result.pattern} (${result.duration}ms)`);
        console.log(`    Method: ${result.method}, URL Type: ${result.urlType}`);
        console.log(`    Expiration: ${result.hasExpiration ? 'Yes' : 'No'}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed patterns:');
      failed.forEach((result) => {
        console.log(`  • ${result.pattern}: ${result.error}`);
      });
    }

    // Test storage initialization (this tests the storage backend)
    console.log('\n🔧 Testing Storage Backend Initialization...');
    try {
      const storage = await initializeStorage(config, {});
      console.log(`✅ Storage initialized: ${storage.provider}`);

      if (storage.provider === 'app-builder') {
        console.log('📱 Using Adobe I/O Files (App Builder storage)');
        console.log('💡 Presigned URL support depends on Files SDK version');
      } else if (storage.provider === 's3') {
        console.log('☁️  Using Amazon S3 storage');
        console.log('✅ S3 presigned URLs fully supported');
      }
    } catch (error) {
      console.log(`❌ Storage initialization failed: ${error.message}`);
    }

    // Presigned URL configuration analysis
    console.log('\n📋 Presigned URL Configuration Analysis:');
    console.log('='.repeat(60));

    const presignedConfig = config.storage.presignedUrls;
    console.log('⏰ Expiration Settings:');
    Object.entries(presignedConfig.expiration).forEach(([key, value]) => {
      const hours = Math.round(value / 3600);
      const days = Math.round(hours / 24);
      console.log(`  • ${key}: ${value}s (${hours}h / ${days}d)`);
    });

    console.log('\n🔄 Access Patterns:');
    Object.entries(presignedConfig.dualAccess.patterns).forEach(([useCase, pattern]) => {
      console.log(`  • ${useCase}: ${pattern.method}`);
    });

    console.log('\n💡 Recommendations:');
    if (successful.length === results.length) {
      console.log('  • All access patterns working correctly!');
      console.log('  • Presigned URL system fully functional');
      console.log('  • Adobe Target integration ready');
    } else if (successful.some((r) => r.method === 'presigned-url')) {
      console.log('  • Presigned URLs partially working');
      console.log('  • Check failed patterns for specific issues');
    } else {
      console.log('  • Presigned URLs not working');
      console.log('  • Check storage backend and SDK configuration');
    }

    return results;
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return null;
  }
}

/**
 * CLI interface for testing
 */
if (require.main === module) {
  require('dotenv').config();

  testPresignedUrlFunctionality()
    .then((results) => {
      if (results && results.some((r) => r.success)) {
        console.log('\n🎉 Presigned URL functionality test completed successfully!');
        return process.exit(0);
      } else {
        console.log('\n💥 Presigned URL functionality test failed');
        return process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      return process.exit(1);
    });
}

module.exports = {
  testPresignedUrlFunctionality,
};
