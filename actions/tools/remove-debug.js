#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with debug statements
const debugFiles = {
  'actions/backend/get-products/lib/auth.js': [
    /console\.log\('\[Auth\].*?\);/g,
    /console\.error\('\[Auth\].*?\);/g,
  ],
  'actions/core/http.js': [/console\.log\('\[Headers\].*?\);/g],
  'actions/backend/get-products/lib/api/products.js': [
    /console\.log\('\[Products\].*?\);/g,
    /console\.error\('\[Products\].*?\);/g,
  ],
  'actions/commerce/integration.js': [
    /console\.log\('\[Commerce\].*?\);/g,
    /console\.error\('\[Commerce\].*?\);/g,
  ],
};

function removeDebugStatements(filePath, patterns) {
  console.log(`Processing ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalSize = content.length;

    // Remove each debug pattern
    patterns.forEach((pattern) => {
      content = content.replace(pattern, '');
    });

    // Clean up any empty lines left behind
    content = content.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync(filePath, content);

    console.log(`✓ Removed debug statements (${originalSize - content.length} bytes)`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Process each file
Object.entries(debugFiles).forEach(([file, patterns]) => {
  const filePath = path.join(process.cwd(), file);
  removeDebugStatements(filePath, patterns);
});

console.log('Debug statement removal complete!');
