/**
 * Monitoring Output Formatting
 * Handles display formatting for monitoring reports
 */

/**
 * Format monitoring output for console display
 * @param {Object} report - Monitoring report from generateMonitoringReport
 */
function formatMonitoringOutput(report) {
  console.log('🎯 Adobe Target URL Expiration Monitor\n');

  if (!report.success) {
    formatErrorOutput(report);
    return;
  }

  formatSuccessOutput(report);
}

/**
 * Format error output
 * @param {Object} report - Error report
 */
function formatErrorOutput(report) {
  const errorMsg = report.error?.message || 'Unknown error';
  console.error('❌ Failed to generate Adobe Target URL:', errorMsg);

  if (errorMsg.includes('AWS credentials') || errorMsg.includes('credentials not found')) {
    console.error('\n🔧 Credential Issue:');
    console.error('   This script requires AWS credentials to generate presigned URLs.');
    console.error('   Since you cannot directly generate URLs, use this alternative approach:');
    console.error('\n💡 Alternative Monitoring Method:');
    console.error('   1. Run: npm run test:action get-products');
    console.error('   2. Check the "Download URL" in the output');
    console.error('   3. Note the date/time when URL was generated');
    console.error('   4. Add 7 days to calculate expiration');
    console.error('   5. Set calendar reminder for URL update');
    console.error('\n📅 Manual Process:');
    console.error('   • Generate new URL weekly');
    console.error('   • Update Adobe Target configuration');
    console.error('   • Verify data feed is working');
  } else {
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Check that Adobe I/O Files SDK is configured');
    console.error('   • Verify environment variables are set');
    console.error('   • Run: npm run test:action get-products');
  }
}

/**
 * Format success output
 * @param {Object} report - Success report with alert and data
 */
function formatSuccessOutput(report) {
  const { alert, data } = report;

  // Current status section
  console.log('📊 Current Adobe Target URL Status:');
  console.log('='.repeat(50));
  console.log(`📅 Generated: ${data.generatedAt.toLocaleString()}`);
  console.log(`⏰ Expires: ${data.expiresAt.toLocaleString()}`);
  console.log(`🔗 Current URL: ${data.url.substring(0, 100)}...`);
  console.log(`⏳ Time remaining: ${Math.round(data.daysUntilExpiry * 10) / 10} days`);

  // Alert section based on time remaining
  console.log(`\n${alert.emoji} ${alert.title}:`);
  console.log('='.repeat(50));

  switch (alert.level) {
    case 'critical':
      console.log(`❌ URL expires in ${Math.round(data.hoursUntilExpiry)} hours!`);
      console.log('🔄 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Generate new presigned URL');
      console.log('   2. Update Adobe Target configuration NOW');
      console.log('   3. Verify data feed is working');
      console.log('\n💡 Command to generate new URL:');
      console.log('   npm run test:action get-products');
      break;

    case 'warning':
      console.log(`⏰ URL expires in ${Math.round(data.daysUntilExpiry * 10) / 10} days`);
      console.log('📋 PLAN UPDATE SOON:');
      console.log('   1. Schedule Adobe Target URL update');
      console.log('   2. Generate new presigned URL');
      console.log('   3. Update Target configuration');
      break;

    case 'notice':
      console.log('🔔 URL update needed within 3 days');
      console.log('📅 Consider scheduling the update soon');
      break;

    case 'ok':
      console.log('🟢 Adobe Target URL is current');
      console.log(`📅 Next update needed: ${data.expiresAt.toLocaleDateString()}`);
      break;
  }

  // Operational reminders
  formatOperationalGuidance();
}

/**
 * Format operational guidance section
 */
function formatOperationalGuidance() {
  console.log('\n📋 Operational Reminders:');
  console.log('='.repeat(50));
  console.log('🔄 Weekly Process:');
  console.log('   1. Run: npm run test:action get-products');
  console.log('   2. Copy the presigned URL from output');
  console.log('   3. Login to Adobe Target admin interface');
  console.log('   4. Update data feed URL configuration');
  console.log('   5. Save and verify feed is working');

  console.log('\n💡 Automation Tip:');
  console.log('   Add this command to your weekly calendar:');
  console.log('   npm run monitor:target');
}

module.exports = {
  formatMonitoringOutput,
  formatErrorOutput,
  formatSuccessOutput,
  formatOperationalGuidance,
};
