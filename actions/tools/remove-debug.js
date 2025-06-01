#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to exclude (development tools and documentation)
const EXCLUDED_DIRS = ['scripts', 'docs', 'test', 'tests', 'actions/tools'];

// Files with debug statements
const debugFiles = {
  'src/core/testing/api.js': [/console\.(log|debug|info)\('.*?\);/g, /console\.error\('.*?\);/g],
  'src/core/http/client.js': [/console\.warn\('Failed to parse request body:.*?\);/g],
  'src/core/storage/files.js': [/console\.warn\(`Failed to get metadata.*?\);/g],
  'actions/backend/get-products/steps/validateInput.js': [/console\.(log|error)\('.*?\);/g],
  'actions/backend/get-products/index.js': [/console\.(log|error)\('.*?\);/g],
  'actions/backend/get-products/lib/api/products.js': [/console\.warn\(`.*?\);/g],
  'actions/backend/get-products/lib/api/categories.js': [/console\.warn\(`.*?\);/g],
  'web-src/src/js/main.js': [/console\.error\('Failed to initialize.*?\);/g],
  'web-src/src/js/htmx/config.js': [/console\.(error|warn)\('.*?\);/g],
  'src/core/tracing/index.js': [/console\.(log|error|warn|debug|info)\('.*?\);/g],
};

// Additional debug patterns to remove
const GLOBAL_PATTERNS = [
  /debugger;/g,
  /\/\/ DEBUG:/g,
  /\/\/ FIXME:/g,
  /\/\* DEBUG:.*?\*\//g,
  /\/\* FIXME:.*?\*\//g,
  /DEBUG\s*=\s*true/g,
  /IS_DEBUG\s*=\s*true/g,
  /VERBOSE\s*=\s*true/g,
];

function shouldProcessFile(filePath) {
  // Check if file is in excluded directory
  return !EXCLUDED_DIRS.some((dir) => filePath.includes(`/${dir}/`));
}

function removeDebugStatements(filePath, patterns) {
  if (!shouldProcessFile(filePath)) {
    console.log(`Skipping excluded file: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalSize = content.length;

    // Remove file-specific debug patterns
    patterns.forEach((pattern) => {
      content = content.replace(pattern, '');
    });

    // Remove global debug patterns
    GLOBAL_PATTERNS.forEach((pattern) => {
      content = content.replace(pattern, '');
    });

    // Clean up any empty lines left behind
    content = content.replace(/^\s*[\r\n]/gm, '');

    // Clean up any leftover empty blocks
    content = content.replace(/{\s*}/g, '{}');

    fs.writeFileSync(filePath, content);

    const bytesRemoved = originalSize - content.length;
    if (bytesRemoved > 0) {
      console.log(`✓ Removed debug statements (${bytesRemoved} bytes)`);
    } else {
      console.log('✓ No debug statements found');
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Process each file
Object.entries(debugFiles).forEach(([file, patterns]) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    removeDebugStatements(filePath, patterns);
  } else {
    console.warn(`⚠ File not found: ${filePath}`);
  }
});

console.log('\nDebug statement removal complete!');
