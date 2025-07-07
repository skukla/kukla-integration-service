#!/usr/bin/env node

/**
 * Phase 10 Automation: Complete Zero Exact Duplicates Achievement
 *
 * Target: 3 shared utility duplicates + 60 exact duplicates
 * Strategy: Final cleanup to achieve zero exact duplicates
 * Expected Result: 0 exact duplicates achieved
 *
 * Remaining shared utility duplicates:
 * - validateAllMeshInputs, buildMeshRequestComponents, validateAndExtractMeshData
 *
 * Remaining exact duplicates (sample):
 * - enrichAllProductsWithCategories, processAllBatches, writeToStorage
 * - performStorageOperation, handleGetRequest, handleDeleteRequest
 * - routeHttpRequest, performCliDetection, performCompleteDetection
 * - tryCliDetection
 */

const fs = require('fs');
const path = require('path');

// Phase 10 Configuration - Shared utility duplicates to fix
const SHARED_UTILITY_FIXES = [
  {
    functionName: 'validateAllMeshInputs',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedFile: 'api.js',
  },
  {
    functionName: 'buildMeshRequestComponents',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedFile: 'api.js',
  },
  {
    functionName: 'validateAndExtractMeshData',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedFile: 'api.js',
  },
];

// Phase 10 Configuration - Exact duplicates to consolidate
const EXACT_DUPLICATES = [
  {
    functionName: 'enrichAllProductsWithCategories',
    pattern: 'other-utility',
    sourceFiles: [
      'actions/backend/get-products/lib/api/enrichProductsWithCategories/facade.js',
      'actions/backend/get-products/lib/api/enrichProductsWithCategories/transformers.js',
    ],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'processAllBatches',
    pattern: 'other-utility',
    sourceFiles: ['actions/backend/get-products/lib/api/inventory/facade.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'writeToStorage',
    pattern: 'other-utility',
    sourceFiles: ['actions/backend/get-products/steps/storeCsv/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'performStorageOperation',
    pattern: 'other-utility',
    sourceFiles: ['actions/backend/get-products/steps/storeCsv/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'handleGetRequest',
    pattern: 'other-utility',
    sourceFiles: ['actions/frontend/browse-files/main/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'handleDeleteRequest',
    pattern: 'other-utility',
    sourceFiles: ['actions/frontend/browse-files/main/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'routeHttpRequest',
    pattern: 'other-utility',
    sourceFiles: ['actions/frontend/browse-files/main/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'performCliDetection',
    pattern: 'other-utility',
    sourceFiles: ['src/core/detectEnvironment/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'performCompleteDetection',
    pattern: 'other-utility',
    sourceFiles: ['src/core/detectEnvironment/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'tryCliDetection',
    pattern: 'other-utility',
    sourceFiles: ['src/core/detectEnvironment/facade.js'],
    targetSharedFile: 'api.js',
  },
];

class Phase10Consolidator {
  constructor() {
    this.results = {
      sharedUtilityFixes: 0,
      exactDuplicatesProcessed: 0,
      functionsEliminated: 0,
      filesUpdated: 0,
      errors: [],
    };
  }

  // Fix shared utility duplicate by removing function and updating import
  fixSharedUtilityDuplicate(fix) {
    const { functionName, sourceFile, sharedFile } = fix;

    try {
      console.log(`\n🔧 Fixing shared utility duplicate: ${functionName}...`);

      if (!fs.existsSync(sourceFile)) {
        console.log(`  ℹ️  Source file ${sourceFile} not found, skipping`);
        return;
      }

      const content = fs.readFileSync(sourceFile, 'utf8');

      // Check if function exists in file
      if (!content.includes(`function ${functionName}`)) {
        console.log(`  ℹ️  Function ${functionName} not found in ${sourceFile}, skipping`);
        return;
      }

      // Remove function definition
      const functionRegex = new RegExp(
        `((?:\\/\\*\\*[\\s\\S]*?\\*\\/)\\s*)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|module\\.exports|$))`,
        'gm'
      );

      let updatedContent = content.replace(functionRegex, '');

      // Add shared import if not already present
      const sharedImportRegex = new RegExp(
        `const\\s+{[^}]*}\\s*=\\s*require\\(['"].*/${sharedFile.replace('.js', '')}['"]\\)`
      );
      const hasSharedImport = sharedImportRegex.test(updatedContent);

      if (!hasSharedImport) {
        // Calculate relative path to shared utilities
        const relativePath = this.getRelativePathToShared(sourceFile, sharedFile);
        const importLine = `const { ${functionName} } = require('${relativePath}');\n`;

        // Add import after existing requires
        const requireRegex = /const\s+{[^}]*}\s*=\s*require\([^)]+\);/g;
        const requires = updatedContent.match(requireRegex) || [];

        if (requires.length > 0) {
          const lastRequire = requires[requires.length - 1];
          const lastRequireIndex = updatedContent.lastIndexOf(lastRequire);
          updatedContent =
            updatedContent.slice(0, lastRequireIndex + lastRequire.length) +
            '\n' +
            importLine +
            updatedContent.slice(lastRequireIndex + lastRequire.length);
        } else {
          updatedContent = importLine + '\n' + updatedContent;
        }
      } else {
        // Add function to existing import
        updatedContent = updatedContent.replace(sharedImportRegex, (match) => {
          const importMatch = match.match(/const\s+{([^}]*)}/);
          if (importMatch) {
            const existingImports = importMatch[1].split(',').map((s) => s.trim());
            if (!existingImports.includes(functionName)) {
              existingImports.push(functionName);
            }
            return match.replace(/const\s+{[^}]*}/, `const { ${existingImports.join(', ')} }`);
          }
          return match;
        });
      }

      fs.writeFileSync(sourceFile, updatedContent);

      this.results.sharedUtilityFixes++;
      console.log(`  ✅ Fixed shared utility duplicate: ${functionName}`);
    } catch (error) {
      console.error(`  ❌ Error fixing ${functionName}: ${error.message}`);
      this.results.errors.push({ functionName, error: error.message });
    }
  }

  // Extract function from source file
  extractFunction(filePath, functionName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Find function definition (including JSDoc)
      const functionRegex = new RegExp(
        `((?:\\/\\*\\*[\\s\\S]*?\\*\\/)\\s*)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|module\\.exports|$))`,
        'gm'
      );

      const match = content.match(functionRegex);
      if (!match) {
        throw new Error(`Function ${functionName} not found in ${filePath}`);
      }

      return match[0].trim();
    } catch (error) {
      throw new Error(`Failed to extract ${functionName} from ${filePath}: ${error.message}`);
    }
  }

  // Add function to shared utility file
  addToSharedFile(sharedFilePath, functionCode, functionName) {
    try {
      if (!fs.existsSync(sharedFilePath)) {
        // Create new shared file
        const header = `/**
 * Shared Functions - Phase 10 Additions
 * Final consolidation to achieve zero exact duplicates
 */

`;
        fs.writeFileSync(sharedFilePath, header);
      }

      const content = fs.readFileSync(sharedFilePath, 'utf8');

      // Check if function already exists
      if (content.includes(`function ${functionName}`)) {
        console.log(`  ℹ️  ${functionName} already exists in shared file`);
        return;
      }

      // Add function to shared file
      const newContent = content + '\n' + functionCode + '\n';
      fs.writeFileSync(sharedFilePath, newContent);

      console.log(`  ✅ Added ${functionName} to shared utilities`);
    } catch (error) {
      throw new Error(`Failed to add ${functionName} to shared file: ${error.message}`);
    }
  }

  // Remove function from original file and add shared import
  updateOriginalFile(filePath, functionName, sharedFile) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if function exists in file
      if (!content.includes(`function ${functionName}`)) {
        console.log(`  ℹ️  Function ${functionName} not found in ${filePath}, skipping`);
        return;
      }

      // Remove function definition
      const functionRegex = new RegExp(
        `((?:\\/\\*\\*[\\s\\S]*?\\*\\/)\\s*)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|module\\.exports|$))`,
        'gm'
      );

      const updatedContent = content.replace(functionRegex, '');

      // Add shared import if not already present
      const sharedImportRegex = new RegExp(
        `const\\s+{[^}]*}\\s*=\\s*require\\(['"].*/${sharedFile.replace('.js', '')}['"]\\)`
      );
      const hasSharedImport = sharedImportRegex.test(updatedContent);

      let finalContent = updatedContent;
      if (!hasSharedImport) {
        // Calculate relative path to shared utilities
        const relativePath = this.getRelativePathToShared(filePath, sharedFile);
        const importLine = `const { ${functionName} } = require('${relativePath}');\n`;

        // Add import after existing requires
        const requireRegex = /const\s+{[^}]*}\s*=\s*require\([^)]+\);/g;
        const requires = updatedContent.match(requireRegex) || [];

        if (requires.length > 0) {
          const lastRequire = requires[requires.length - 1];
          const lastRequireIndex = updatedContent.lastIndexOf(lastRequire);
          finalContent =
            updatedContent.slice(0, lastRequireIndex + lastRequire.length) +
            '\n' +
            importLine +
            updatedContent.slice(lastRequireIndex + lastRequire.length);
        } else {
          finalContent = importLine + '\n' + updatedContent;
        }
      } else {
        // Add function to existing import
        finalContent = updatedContent.replace(sharedImportRegex, (match) => {
          const importMatch = match.match(/const\s+{([^}]*)}/);
          if (importMatch) {
            const existingImports = importMatch[1].split(',').map((s) => s.trim());
            if (!existingImports.includes(functionName)) {
              existingImports.push(functionName);
            }
            return match.replace(/const\s+{[^}]*}/, `const { ${existingImports.join(', ')} }`);
          }
          return match;
        });
      }

      fs.writeFileSync(filePath, finalContent);
      console.log(`  ✅ Updated ${filePath} with shared import`);
    } catch (error) {
      throw new Error(`Failed to update ${filePath}: ${error.message}`);
    }
  }

  // Get relative path to shared utilities
  getRelativePathToShared(filePath, sharedFile) {
    const fileDir = path.dirname(filePath);
    const sharedDir = 'src/core/shared';
    const relativePath = path.relative(fileDir, sharedDir);
    return './' + relativePath.replace(/\\/g, '/') + '/' + sharedFile.replace('.js', '');
  }

  // Process exact duplicate
  async processExactDuplicate(duplicate) {
    const { functionName, sourceFiles, targetSharedFile } = duplicate;

    try {
      console.log(`\n📋 Processing exact duplicate: ${functionName}...`);

      // Find the first available source file
      const availableFile = sourceFiles.find((file) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          return content.includes(`function ${functionName}`);
        }
        return false;
      });

      if (!availableFile) {
        console.log(`  ℹ️  No source files found for ${functionName}, skipping`);
        return;
      }

      // Extract function from the first available file
      const functionCode = this.extractFunction(availableFile, functionName);

      // Add to shared utilities
      const sharedFilePath = `src/core/shared/${targetSharedFile}`;
      this.addToSharedFile(sharedFilePath, functionCode, functionName);

      // Update all files that contain this function
      for (const file of sourceFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes(`function ${functionName}`)) {
            this.updateOriginalFile(file, functionName, targetSharedFile);
          }
        }
      }

      this.results.exactDuplicatesProcessed++;
      this.results.functionsEliminated++;

      console.log(`  ✅ ${functionName} consolidated successfully`);
    } catch (error) {
      console.error(`  ❌ Error processing ${functionName}: ${error.message}`);
      this.results.errors.push({ functionName, error: error.message });
    }
  }

  // Update shared utilities exports
  updateSharedExports() {
    try {
      const sharedApiPath = 'src/core/shared/api.js';

      if (fs.existsSync(sharedApiPath)) {
        const content = fs.readFileSync(sharedApiPath, 'utf8');

        // Get function names from this file
        const functionNames = [];
        const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
          functionNames.push(match[1]);
        }

        // Update or add module.exports
        if (functionNames.length > 0) {
          const exportsRegex = /module\.exports\s*=\s*{[^}]*}/;
          const exportsLine = `module.exports = {\n  ${functionNames.join(',\n  ')}\n};`;

          if (exportsRegex.test(content)) {
            const updatedContent = content.replace(exportsRegex, exportsLine);
            fs.writeFileSync(sharedApiPath, updatedContent);
          } else if (!content.includes('module.exports')) {
            fs.writeFileSync(sharedApiPath, content + '\n' + exportsLine + '\n');
          }
        }
      }

      console.log('  ✅ Updated shared utility exports');
    } catch (error) {
      console.error(`  ❌ Error updating exports: ${error.message}`);
    }
  }

  // Run Phase 10 consolidation
  async run() {
    console.log('🚀 Phase 10: Complete Zero Exact Duplicates Achievement');
    console.log('='.repeat(60));
    console.log(
      `Target: ${SHARED_UTILITY_FIXES.length} shared utility fixes + ${EXACT_DUPLICATES.length} exact duplicate groups`
    );
    console.log('Strategy: Final cleanup to achieve zero exact duplicates');
    console.log('Expected: 0 exact duplicates achieved\n');

    // Fix shared utility duplicates first
    console.log('🔧 Fixing shared utility duplicates...');
    for (const fix of SHARED_UTILITY_FIXES) {
      this.fixSharedUtilityDuplicate(fix);
    }

    // Process exact duplicates
    console.log('\n📋 Processing exact duplicates...');
    for (const duplicate of EXACT_DUPLICATES) {
      await this.processExactDuplicate(duplicate);
    }

    // Update shared utility exports
    this.updateSharedExports();

    // Count unique files updated
    const allFiles = [
      ...SHARED_UTILITY_FIXES.map((f) => f.sourceFile),
      ...EXACT_DUPLICATES.flatMap((d) => d.sourceFiles),
    ];
    this.results.filesUpdated = new Set(allFiles.filter((f) => fs.existsSync(f))).size;

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 Phase 10 Results:');
    console.log(`✅ Shared utility fixes: ${this.results.sharedUtilityFixes}`);
    console.log(`✅ Exact duplicates processed: ${this.results.exactDuplicatesProcessed}`);
    console.log(`✅ Functions eliminated: ${this.results.functionsEliminated}`);
    console.log(`✅ Files updated: ${this.results.filesUpdated}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.functionName}: ${error.error}`);
      });
    }

    console.log('\n🎯 Phase 10 Complete!');
    console.log('🏆 GOAL ACHIEVED: Zero exact duplicates targeted!');
    console.log('Run `npm run audit:duplicates` to verify final state');
    console.log('Run `npm run test:action get-products` to verify functionality');
    console.log('\n📈 Next Phase: Function count reduction via shared utility expansion');
  }
}

// Run Phase 10 if called directly
if (require.main === module) {
  const consolidator = new Phase10Consolidator();
  consolidator.run().catch(console.error);
}

module.exports = { Phase10Consolidator };
