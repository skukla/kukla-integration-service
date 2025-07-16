#!/usr/bin/env node

/**
 * Comprehensive unused code audit script (IMPROVED VERSION)
 * Analyzes backend code for unused exports, imports, and unreferenced files
 * with better handling of destructured imports and relative paths
 */

const fs = require('fs');
const path = require('path');

const glob = require('glob');

const BACKEND_DIRS = ['src', 'actions', 'config', 'scripts'];
const IGNORE_PATTERNS = ['node_modules/**', 'dist/**', '**/*.test.js', '**/*.spec.js'];

// Known entry points that should not be marked as unreferenced
const ENTRY_POINTS = [
  'actions/*/index.js',
  'config/index.js',
  'src/index.js',
  'scripts/index.js',
  'scripts/test.js',
  'scripts/build.js',
  'scripts/deploy.js',
  'scripts/monitor.js',
];

/**
 * Get all JavaScript files in backend directories
 */
function getAllJsFiles() {
  const allFiles = [];

  for (const dir of BACKEND_DIRS) {
    if (fs.existsSync(dir)) {
      const files = glob.sync(`${dir}/**/*.js`, { ignore: IGNORE_PATTERNS });
      allFiles.push(...files);
    }
  }

  return allFiles;
}

/**
 * Extract exports from a file with improved parsing
 */
function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = [];

    // Match module.exports = { ... } with better handling of multiline
    const moduleExportsMatch = content.match(
      /module\.exports\s*=\s*\{([^}]+(?:\}[^}]*\{[^}]*)*[^}]*)\}/s
    );
    if (moduleExportsMatch) {
      const exportBody = moduleExportsMatch[1];
      // Improved regex to match property names including comments
      const exportNames = exportBody.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:, ]/gm);
      if (exportNames) {
        exports.push(...exportNames.map((name) => name.replace(/\s*[:, ].*/, '').trim()));
      }
    }

    // Match module.exports.functionName = ...
    const directExports = content.match(/module\.exports\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g) || [];
    exports.push(...directExports.map((match) => match.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1]));

    // Match exports.functionName = ...
    const namedExports = content.match(/exports\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g) || [];
    exports.push(...namedExports.map((match) => match.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/)[1]));

    return [...new Set(exports.filter(Boolean))]; // Remove duplicates
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Extract imports from a file with improved destructured import detection
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];

    // Match simple require statements
    const simpleRequires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    imports.push(
      ...simpleRequires.map((match) => {
        const modulePath = match.match(/['"]([^'"]+)['"]/)[1];
        return { type: 'simple', module: modulePath, functions: [] };
      })
    );

    // Match destructured requires with improved regex
    const destructuredPattern =
      /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let destructuredMatch;
    while ((destructuredMatch = destructuredPattern.exec(content)) !== null) {
      const functionsStr = destructuredMatch[1];
      const modulePath = destructuredMatch[2];

      // Parse destructured function names, handling comments and whitespace
      const functions = functionsStr
        .split(',')
        .map((f) => f.trim())
        .map((f) =>
          f
            .replace(/\/\*.*?\*\//g, '')
            .replace(/\/\/.*$/, '')
            .trim()
        )
        .filter((f) => f && f.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/));

      imports.push({ type: 'destructured', module: modulePath, functions });
    }

    // Match variable assignments from requires
    const assignmentRequires =
      content.match(
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      ) || [];
    imports.push(
      ...assignmentRequires.map((match) => {
        const parts = match.match(
          /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/
        );
        return { type: 'assignment', module: parts[2], variable: parts[1], functions: [] };
      })
    );

    return imports;
  } catch (error) {
    console.warn(`Warning: Could not parse imports in ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Check if a function is used in file content with improved detection
 */
function isFunctionUsed(functionName, content, imports) {
  // Remove comments and strings to avoid false positives
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/['"`](?:\\.|[^'"`\\])*['"`]/g, ''); // Remove strings

  // Check if function is destructured imported
  for (const imp of imports) {
    if (imp.type === 'destructured' && imp.functions.includes(functionName)) {
      // Function is explicitly imported, check if it's used
      const usagePatterns = [
        new RegExp(`\\b${functionName}\\s*\\(`, 'g'), // function calls
        new RegExp(`\\b${functionName}\\s*=`, 'g'), // assignments
        new RegExp(`\\b${functionName}\\b(?!\\s*[:{])`, 'g'), // references (not object keys)
      ];

      for (const pattern of usagePatterns) {
        if (pattern.test(cleanContent)) {
          return true;
        }
      }
    }
  }

  // Check for general usage patterns
  const usagePatterns = [
    new RegExp(`\\b${functionName}\\s*\\(`, 'g'), // function calls
    new RegExp(`\\b${functionName}\\s*=`, 'g'), // assignments
    new RegExp(`\\b${functionName}\\b(?!\\s*[:])`, 'g'), // references (not object keys)
  ];

  for (const pattern of usagePatterns) {
    const matches = cleanContent.match(pattern) || [];
    // Filter out the export definition itself
    const realUsages = matches.filter((match) => {
      const context = cleanContent.slice(
        Math.max(0, cleanContent.indexOf(match) - 50),
        cleanContent.indexOf(match) + match.length + 50
      );
      return !context.includes('module.exports') && !context.includes('exports.');
    });

    if (realUsages.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a file is referenced by others with improved path resolution
 */
function isFileReferenced(targetFile, allFiles, allContent) {
  // Skip entry points
  for (const entryPattern of ENTRY_POINTS) {
    if (targetFile.match(entryPattern.replace(/\*/g, '[^/]+'))) {
      return true;
    }
  }

  const targetPath = path.relative(process.cwd(), targetFile);
  const targetWithoutExt = targetPath.replace(/\.js$/, '');

  for (const [otherFile, content] of allContent) {
    if (otherFile === targetFile) continue;

    // Check for various import patterns
    const importPatterns = [
      targetPath,
      targetWithoutExt,
      './' + targetPath,
      './' + targetWithoutExt,
    ];

    for (const pattern of importPatterns) {
      if (content.includes(`'${pattern}'`) || content.includes(`"${pattern}"`)) {
        return true;
      }
    }

    // Check for relative imports from the other file's perspective
    const otherDir = path.dirname(otherFile);
    const relativePath = path.relative(otherDir, targetFile);
    const relativeWithoutExt = relativePath.replace(/\.js$/, '');

    if (
      content.includes(`'${relativePath}'`) ||
      content.includes(`"${relativePath}"`) ||
      content.includes(`'./${relativePath}'`) ||
      content.includes(`"./${relativePath}"`) ||
      content.includes(`'${relativeWithoutExt}'`) ||
      content.includes(`"${relativeWithoutExt}"`)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Main audit function with improved accuracy
 */
async function auditUnusedCode() {
  console.log('🔍 Starting improved unused code audit...\n');

  const allFiles = getAllJsFiles();
  console.log(`📁 Analyzing ${allFiles.length} JavaScript files in backend directories\n`);

  const results = {
    unusedExports: [],
    unusedImports: [],
    unreferencedFiles: [],
    summary: {
      totalFiles: allFiles.length,
      filesWithExports: 0,
      totalExports: 0,
      unusedExportsCount: 0,
    },
  };

  // Build a map of all files and their exports/imports
  const fileExports = new Map();
  const fileImports = new Map();
  const allContent = new Map();

  // First pass: collect all exports, imports, and content
  console.log('🔍 Analyzing exports and imports...\n');
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    allContent.set(file, content);

    const exports = extractExports(file);
    const imports = extractImports(file);

    if (exports.length > 0) {
      fileExports.set(file, exports);
      results.summary.filesWithExports++;
      results.summary.totalExports += exports.length;
    }

    if (imports.length > 0) {
      fileImports.set(file, imports);
    }
  }

  // Second pass: check for usage with improved detection
  console.log('🔍 Checking for unused exports with improved detection...\n');

  for (const [filePath, exports] of fileExports) {
    for (const exportName of exports) {
      let isUsed = false;

      // Check if this export is imported or used anywhere
      for (const [otherFile, content] of allContent) {
        if (otherFile === filePath) continue; // Skip self

        const imports = fileImports.get(otherFile) || [];

        // Check if this export is used in other files
        if (isFunctionUsed(exportName, content, imports)) {
          isUsed = true;
          break;
        }
      }

      if (!isUsed) {
        results.unusedExports.push({
          file: filePath,
          export: exportName,
        });
        results.summary.unusedExportsCount++;
      }
    }
  }

  // Third pass: check for unreferenced files with improved detection
  console.log('🔍 Checking for unreferenced files with improved detection...\n');

  for (const file of allFiles) {
    if (!isFileReferenced(file, allFiles, allContent)) {
      results.unreferencedFiles.push(path.relative(process.cwd(), file));
    }
  }

  // Report results
  console.log('📊 IMPROVED UNUSED CODE AUDIT RESULTS\n');
  console.log('='.repeat(50));

  console.log(`📁 Total files analyzed: ${results.summary.totalFiles}`);
  console.log(`📤 Files with exports: ${results.summary.filesWithExports}`);
  console.log(`📤 Total exports found: ${results.summary.totalExports}`);
  console.log(`❌ Potentially unused exports: ${results.summary.unusedExportsCount}`);
  console.log(`🚫 Potentially unreferenced files: ${results.unreferencedFiles.length}\n`);

  if (results.unusedExports.length > 0) {
    console.log('❌ POTENTIALLY UNUSED EXPORTS:');
    console.log('-'.repeat(30));
    for (const { file, export: exportName } of results.unusedExports) {
      console.log(`  📁 ${file}`);
      console.log(`    ❌ ${exportName}`);
    }
    console.log('');
  } else {
    console.log('✅ No potentially unused exports found!\n');
  }

  if (results.unreferencedFiles.length > 0) {
    console.log('🚫 POTENTIALLY UNREFERENCED FILES:');
    console.log('-'.repeat(30));
    for (const file of results.unreferencedFiles) {
      console.log(`  🚫 ${file}`);
    }
    console.log('');
  } else {
    console.log('✅ No potentially unreferenced files found!\n');
  }

  // Improved recommendations
  console.log('💡 IMPROVED RECOMMENDATIONS:');
  console.log('-'.repeat(30));

  if (results.unusedExports.length > 0) {
    console.log('• Review unused exports - some may be legitimately unused');
    console.log('• Consider dynamic usage patterns that static analysis cannot detect');
    console.log('• Check for exports used in documentation, tests, or external tools');
  }

  if (results.unreferencedFiles.length > 0) {
    console.log('• Review unreferenced files for potential removal');
    console.log('• Consider files that may be entry points or used by external systems');
    console.log('• Check for files referenced in configuration or documentation');
  }

  if (results.unusedExports.length === 0 && results.unreferencedFiles.length === 0) {
    console.log('✅ Excellent! No unused code detected with improved analysis');
  }

  console.log(
    '\n📝 Note: This improved audit reduces false positives but manual verification is still recommended!'
  );

  return results;
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditUnusedCode().catch(console.error);
}

module.exports = { auditUnusedCode };
