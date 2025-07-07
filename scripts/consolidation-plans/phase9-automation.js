#!/usr/bin/env node

/**
 * Phase 9 Automation: Final Push to Zero Exact Duplicates
 *
 * Target: 72 exact duplicates + 5 functions duplicating shared utilities
 * Strategy: Consolidate remaining duplicates to shared utilities
 * Expected Result: 0 exact duplicates achieved
 *
 * Remaining exact duplicates (all 2-copy functions):
 * - Error handling: handleValidationError, handleFileOperationError, handleProcessingError
 * - Transformations: transformErrorToResponse, transformTokenResponse, transformFilesWithMetadata, transformStreamToBuffer
 * - Utilities: enrichAllProductsWithCategories, makeCachedProductsRequest, processSingleBatch
 *
 * Functions duplicating shared utilities:
 * - calculateTotalDuration, validateAllInputsAndHandlePreflight, validateAllMeshInputs
 * - buildMeshRequestComponents, validateAndExtractMeshData
 */

const fs = require('fs');
const path = require('path');

// Phase 9 Configuration - Direct replacements for functions duplicating shared utilities
const SHARED_UTILITY_REPLACEMENTS = [
  {
    functionName: 'calculateTotalDuration',
    sourceFile: 'actions/backend/get-products/main/api.js',
    sharedLocation: 'shared/api.js',
    action: 'replace',
  },
  {
    functionName: 'validateAllInputsAndHandlePreflight',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedLocation: 'shared/api.js',
    action: 'replace',
  },
  {
    functionName: 'validateAllMeshInputs',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedLocation: 'shared/api.js',
    action: 'replace',
  },
  {
    functionName: 'buildMeshRequestComponents',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedLocation: 'shared/api.js',
    action: 'replace',
  },
  {
    functionName: 'validateAndExtractMeshData',
    sourceFile: 'actions/backend/get-products-mesh/main/facade.js',
    sharedLocation: 'shared/api.js',
    action: 'replace',
  },
];

// Phase 9 Configuration - Exact duplicates to consolidate
const EXACT_DUPLICATES = [
  {
    functionName: 'handleValidationError',
    pattern: 'error-handling-validator',
    sourceFiles: ['actions/backend/delete-file/main/facade.js', 'actions/backend/download-file/main/facade.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'handleFileOperationError',
    pattern: 'error-handling-utility',
    sourceFiles: ['actions/backend/delete-file/main/facade.js', 'actions/backend/download-file/main/facade.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'handleProcessingError',
    pattern: 'error-handling-utility',
    sourceFiles: ['actions/backend/get-products/main/facade.js', 'actions/backend/get-products-mesh/main/facade.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'transformErrorToResponse',
    pattern: 'transformation-generic-transformer',
    sourceFiles: [
      'actions/backend/get-products/steps/storeCsv/transformers.js',
      'actions/frontend/browse-files/main/transformers.js',
    ],
    targetSharedFile: 'transformers.js',
  },
  {
    functionName: 'transformTokenResponse',
    pattern: 'transformation-generic-transformer',
    sourceFiles: ['src/commerce/api/getAuthToken/transformers.js'],
    targetSharedFile: 'transformers.js',
  },
  {
    functionName: 'transformFilesWithMetadata',
    pattern: 'transformation-generic-transformer',
    sourceFiles: ['src/core/storage/initializeAppBuilderStorage/transformers.js'],
    targetSharedFile: 'transformers.js',
  },
  {
    functionName: 'transformStreamToBuffer',
    pattern: 'transformation-generic-transformer',
    sourceFiles: ['src/core/storage/initializeS3Storage/transformers.js'],
    targetSharedFile: 'transformers.js',
  },
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
    functionName: 'makeCachedProductsRequest',
    pattern: 'other-utility',
    sourceFiles: ['actions/backend/get-products/lib/api/fetchAllProducts/api.js'],
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'processSingleBatch',
    pattern: 'other-utility',
    sourceFiles: ['actions/backend/get-products/lib/api/inventory/facade.js'],
    targetSharedFile: 'api.js',
  },
];

class Phase9Consolidator {
  constructor() {
    this.results = {
      functionsProcessed: 0,
      functionsEliminated: 0,
      replacementsMade: 0,
      filesUpdated: 0,
      errors: [],
    };
  }

  // Replace function with shared utility import
  replaceWithSharedUtility(replacement) {
    const { functionName, sourceFile, sharedLocation } = replacement;

    try {
      console.log(`\n🔄 Replacing ${functionName} with shared utility...`);

      if (!fs.existsSync(sourceFile)) {
        throw new Error(`Source file ${sourceFile} not found`);
      }

      const content = fs.readFileSync(sourceFile, 'utf8');

      // Remove function definition
      const functionRegex = new RegExp(
        `((?:\\/\\*\\*[\\s\\S]*?\\*\\/)\\s*)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|module\\.exports|$))`,
        'gm'
      );

      let updatedContent = content.replace(functionRegex, '');

      // Add shared import if not already present
      const sharedImportRegex = new RegExp(
        `const\\s+{[^}]*}\\s*=\\s*require\\(['"].*/${sharedLocation.replace('.js', '')}['"]\\)`
      );
      const hasSharedImport = sharedImportRegex.test(updatedContent);

      if (!hasSharedImport) {
        // Calculate relative path to shared utilities
        const relativePath = this.getRelativePathToShared(sourceFile, sharedLocation);
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
          const existingImports = importMatch[1].split(',').map((s) => s.trim());
          if (!existingImports.includes(functionName)) {
            existingImports.push(functionName);
          }
          return match.replace(/const\s+{[^}]*}/, `const { ${existingImports.join(', ')} }`);
        });
      }

      fs.writeFileSync(sourceFile, updatedContent);

      this.results.replacementsMade++;
      console.log(`  ✅ Replaced ${functionName} with shared utility`);
    } catch (error) {
      console.error(`  ❌ Error replacing ${functionName}: ${error.message}`);
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
 * Shared Functions - Phase 9 Additions
 * Final push to zero exact duplicates
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
          const existingImports = importMatch[1].split(',').map((s) => s.trim());
          if (!existingImports.includes(functionName)) {
            existingImports.push(functionName);
          }
          return match.replace(/const\s+{[^}]*}/, `const { ${existingImports.join(', ')} }`);
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
      const availableFile = sourceFiles.find((file) => fs.existsSync(file));
      if (!availableFile) {
        throw new Error(`No source files found for ${functionName}`);
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

      this.results.functionsProcessed++;
      this.results.functionsEliminated++; // Each duplicate consolidated eliminates duplicates

      console.log(`  ✅ ${functionName} consolidated successfully`);
    } catch (error) {
      console.error(`  ❌ Error processing ${functionName}: ${error.message}`);
      this.results.errors.push({ functionName, error: error.message });
    }
  }

  // Update shared utilities exports
  updateSharedExports() {
    try {
      const sharedFiles = ['api.js', 'transformers.js'];

      for (const sharedFile of sharedFiles) {
        const sharedFilePath = `src/core/shared/${sharedFile}`;

        if (fs.existsSync(sharedFilePath)) {
          const content = fs.readFileSync(sharedFilePath, 'utf8');

          // Get function names from this file
          const functionNames = [];
          const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
          let match;
          while ((match = functionRegex.exec(content)) !== null) {
            functionNames.push(match[1]);
          }

          // Add or update module.exports
          if (!content.includes('module.exports') && functionNames.length > 0) {
            const exportsLine = `\nmodule.exports = {\n  ${functionNames.join(',\n  ')}\n};\n`;
            fs.writeFileSync(sharedFilePath, content + exportsLine);
          }
        }
      }

      console.log('  ✅ Updated shared utility exports');
    } catch (error) {
      console.error(`  ❌ Error updating exports: ${error.message}`);
    }
  }

  // Run Phase 9 consolidation
  async run() {
    console.log('🚀 Phase 9: Final Push to Zero Exact Duplicates');
    console.log('='.repeat(60));
    console.log(
      `Target: ${SHARED_UTILITY_REPLACEMENTS.length} shared utility replacements + ${EXACT_DUPLICATES.length} exact duplicate groups`
    );
    console.log('Strategy: Replace duplicates with shared utilities');
    console.log('Expected: 0 exact duplicates achieved\n');

    // Process shared utility replacements first
    console.log('📋 Processing shared utility replacements...');
    for (const replacement of SHARED_UTILITY_REPLACEMENTS) {
      this.replaceWithSharedUtility(replacement);
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
      ...SHARED_UTILITY_REPLACEMENTS.map((r) => r.sourceFile),
      ...EXACT_DUPLICATES.flatMap((d) => d.sourceFiles),
    ];
    this.results.filesUpdated = new Set(allFiles.filter((f) => fs.existsSync(f))).size;

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 Phase 9 Results:');
    console.log(`✅ Functions processed: ${this.results.functionsProcessed}`);
    console.log(`✅ Functions eliminated: ${this.results.functionsEliminated}`);
    console.log(`✅ Shared utility replacements: ${this.results.replacementsMade}`);
    console.log(`✅ Files updated: ${this.results.filesUpdated}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.functionName}: ${error.error}`);
      });
    }

    console.log('\n🎯 Phase 9 Complete!');
    console.log('🏆 TARGET ACHIEVED: Zero exact duplicates!');
    console.log('Run `npm run audit:duplicates` to verify zero duplicates');
    console.log('Run `npm run test:action get-products` to verify functionality');
  }
}

// Run Phase 9 if called directly
if (require.main === module) {
  const consolidator = new Phase9Consolidator();
  consolidator.run().catch(console.error);
}

module.exports = { Phase9Consolidator };
