#!/usr/bin/env node

/**
 * Test Presigned URL Integration with Real Files
 *
 * Tests presigned URL functionality using actual stored files and credentials
 */

require('dotenv').config();

const { loadConfig } = require('./config');
const { generateFileAccessUrl } = require('./src/files/utils/access-patterns');

/**
 * Test a single access pattern
 */
async function testAccessPattern(test, filename, config, actionParams) {
  console.log(`📋 ${test.name}`);
  console.log(`   Use Case: ${test.useCase}`);
  console.log(`   Description: ${test.description}`);

  const result = await generateFileAccessUrl(filename, test.useCase, config, actionParams);

  if (result.success) {
    console.log('   ✅ SUCCESS');
    console.log(`   🔧 Method: ${result.method}`);
    console.log(`   🌐 URL Type: ${result.urlType}`);
    console.log(`   📎 URL: ${result.url.substring(0, 80)}...`);

    if (result.expiresAt) {
      const expirationDate = new Date(result.expiresAt);
      const hoursFromNow = Math.round((expirationDate - new Date()) / (1000 * 60 * 60));
      console.log(`   ⏰ Expires: ${expirationDate.toISOString()} (${hoursFromNow} hours)`);
    } else {
      console.log('   ⏰ Expires: Never (action URL)');
    }
  } else {
    console.log('   ❌ FAILED');
    console.log(`   💥 Error: ${result.error?.message || 'Unknown error'}`);
  }

  console.log(''); // Space between tests
}

/**
 * Test presigned URL integration with real stored files
 */
async function testPresignedUrlIntegration() {
  console.log('🧪 Testing Presigned URL Integration with Real Files...\n');

  try {
    // Load configuration with proper credentials
    const config = loadConfig();

    // Use actual action parameters (would have credentials in real deployment)
    const actionParams = {
      // Note: In production these would come from app.config.yaml
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION,
      LOG_LEVEL: 'debug',
    };

    console.log('✅ Configuration loaded');
    console.log(`📦 Storage Provider: ${config.storage.provider}`);
    console.log(`📂 Test File: ${config.storage.csv.filename}`);

    // Test different access patterns
    const accessTests = [
      {
        name: 'User Download (Action URL)',
        useCase: 'user',
        description: 'Standard user download via action',
      },
      {
        name: 'Adobe Target (Presigned URL)',
        useCase: 'adobeTarget',
        description: 'Adobe Target integration with 7-day expiration',
      },
    ];

    console.log('\n🔍 Testing Access Patterns:\n');

    for (const test of accessTests) {
      try {
        await testAccessPattern(test, config.storage.csv.filename, config, actionParams);
      } catch (error) {
        console.log('   ❌ EXCEPTION');
        console.log(`   💥 Error: ${error.message}`);
        console.log('');
      }
    }

    // Show configuration summary
    console.log('📊 Presigned URL Configuration Summary:');
    console.log('=====================================');
    console.log(`🔧 Provider: ${config.storage.provider}`);
    console.log(`📁 Directory: ${config.storage.directory}`);
    console.log(`⚙️  Enabled: ${config.storage.presignedUrls.enabled}`);

    if (config.storage.presignedUrls.enabled) {
      console.log('\n⏰ Expiration Settings:');
      Object.entries(config.storage.presignedUrls.expiration).forEach(([key, seconds]) => {
        const hours = Math.round(seconds / 3600);
        const days = Math.round(hours / 24);
        console.log(`   • ${key}: ${seconds}s (${hours}h / ${days}d)`);
      });
    }

    console.log('\n🎯 Adobe Target Integration Notes:');
    console.log('• Requires presigned URLs (technical constraint)');
    console.log('• Maximum 7-day expiration (AWS S3 limit)');
    console.log('• Weekly manual URL updates required');
    console.log('• CDN-based external URLs for performance');

    console.log('\n💡 Key Benefits:');
    console.log('• Users get reliable action URLs (no expiration)');
    console.log('• Adobe Target gets presigned URLs (required)');
    console.log('• Configurable per-system access patterns');
    console.log('• Automatic fallback for unknown systems');

    return true;
  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
    return false;
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  testPresignedUrlIntegration()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Presigned URL integration test completed!');
        return process.exit(0);
      } else {
        console.log('\n💥 Integration test failed');
        return process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      return process.exit(1);
    });
}

module.exports = {
  testPresignedUrlIntegration,
};
