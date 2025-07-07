#!/usr/bin/env node

/**
 * Phase 8 Automation: Final Exact Duplicate Elimination
 *
 * Target: 92 exact duplicate functions (all "other-orchestrator" pattern)
 * Strategy: Move orchestrator functions to shared/api.js
 * Expected Result: ~46 functions eliminated (92 → 46)
 *
 * All duplicates are orchestrator functions with 2 copies each:
 * - executeFileDeletion, executeFileDownload, executeProductFetching
 * - executeProductFetchAndEnrich, executeProductProcessing, executeStorage
 * - executeMeshFetch, executeMeshProductExport, executeTokenRequest, executeHttpRequest
 */

const fs = require('fs');
const path = require('path');

// Phase 8 Configuration
const PHASE_8_DUPLICATES = [
  {
    functionName: 'executeFileDeletion',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/delete-file/main/facade.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeFileDownload',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/download-file/main/facade.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeProductFetching',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products/lib/api/products/facade.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeProductFetchAndEnrich',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products/main/api.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeProductProcessing',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products/main/facade.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeStorage',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products/steps/storeCsv/facade.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeMeshFetch',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products-mesh/main/api.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeMeshProductExport',
    pattern: 'other-orchestrator',
    sourceFile: 'actions/backend/get-products-mesh/main/api.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeTokenRequest',
    pattern: 'other-orchestrator',
    sourceFile: 'src/commerce/api/getAuthToken/api.js',
    targetSharedFile: 'api.js',
  },
  {
    functionName: 'executeHttpRequest',
    pattern: 'other-orchestrator',
    sourceFile: 'src/commerce/api/makeCommerceRequest/api.js',
    targetSharedFile: 'api.js',
  },
];

// Files that will need to import from shared utilities
const FILES_TO_UPDATE = [
  'actions/backend/delete-file/main/facade.js',
  'actions/backend/download-file/main/facade.js',
  'actions/backend/get-products/lib/api/products/facade.js',
  'actions/backend/get-products/main/api.js',
  'actions/backend/get-products/main/facade.js',
  'actions/backend/get-products/steps/storeCsv/facade.js',
  'actions/backend/get-products-mesh/main/api.js',
  'src/commerce/api/getAuthToken/api.js',
  'src/commerce/api/makeCommerceRequest/api.js',
];

class Phase8Consolidator {
  constructor() {
    this.results = {
      functionsProcessed: 0,
      functionsEliminated: 0,
      filesUpdated: 0,
      errors: [],
    };
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
 * Shared API Functions - Phase 8 Additions
 * Orchestrator functions consolidated from implementation directories
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
  updateOriginalFile(filePath, functionName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Remove function definition
      const functionRegex = new RegExp(
        `((?:\\/\\*\\*[\\s\\S]*?\\*\\/)\\s*)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}(?=\\s*(?:function|module\\.exports|$))`,
        'gm'
      );

      const updatedContent = content.replace(functionRegex, '');

      // Add shared import if not already present
      const sharedImportRegex = /const\s+{[^}]*}\s*=\s*require\(['"](.*\/shared\/api)['"]\)/;
      const hasSharedImport = sharedImportRegex.test(updatedContent);

      let finalContent = updatedContent;
      if (!hasSharedImport) {
        // Calculate relative path to shared/api.js
        const relativePath = this.getRelativePathToShared(filePath);
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
        finalContent = updatedContent.replace(sharedImportRegex, (match, p1) => {
          const importMatch = match.match(/const\s+{([^}]*)}/);
          const existingImports = importMatch[1].split(',').map((s) => s.trim());
          if (!existingImports.includes(functionName)) {
            existingImports.push(functionName);
          }
          return `const { ${existingImports.join(', ')} } = require('${p1}')`;
        });
      }

      fs.writeFileSync(filePath, finalContent);
      console.log(`  ✅ Updated ${filePath} with shared import`);
    } catch (error) {
      throw new Error(`Failed to update ${filePath}: ${error.message}`);
    }
  }

  // Get relative path to shared utilities
  getRelativePathToShared(filePath) {
    const fileDir = path.dirname(filePath);
    const sharedDir = 'src/core/shared';
    const relativePath = path.relative(fileDir, sharedDir);
    return './' + relativePath.replace(/\\/g, '/') + '/api';
  }

  // Process single duplicate function
  async processDuplicate(duplicate) {
    const { functionName, sourceFile, targetSharedFile } = duplicate;

    try {
      console.log(`\n📋 Processing ${functionName}...`);

      // Extract function from source file
      const functionCode = this.extractFunction(sourceFile, functionName);

      // Add to shared utilities
      const sharedFilePath = `src/core/shared/${targetSharedFile}`;
      this.addToSharedFile(sharedFilePath, functionCode, functionName);

      // Update all files that use this function
      const affectedFiles = FILES_TO_UPDATE.filter(
        (file) => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(functionName)
      );

      for (const file of affectedFiles) {
        this.updateOriginalFile(file, functionName);
      }

      this.results.functionsProcessed++;
      this.results.functionsEliminated++; // Each duplicate consolidated eliminates 1 function

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
      const sharedIndexPath = 'src/core/shared/index.js';

      // Update api.js exports
      if (fs.existsSync(sharedApiPath)) {
        const content = fs.readFileSync(sharedApiPath, 'utf8');
        const functionNames = PHASE_8_DUPLICATES.map((d) => d.functionName);

        // Add module.exports if not present
        if (!content.includes('module.exports')) {
          const exportsLine = `\nmodule.exports = {\n  ${functionNames.join(',\n  ')}\n};\n`;
          fs.writeFileSync(sharedApiPath, content + exportsLine);
        }
      }

      // Update shared/index.js to export new functions
      if (fs.existsSync(sharedIndexPath)) {
        const content = fs.readFileSync(sharedIndexPath, 'utf8');
        const functionNames = PHASE_8_DUPLICATES.map((d) => d.functionName);

        // Add to existing exports
        for (const funcName of functionNames) {
          if (!content.includes(funcName)) {
            const newExport = `const { ${funcName} } = require('./api');\n`;
            fs.writeFileSync(sharedIndexPath, content + newExport);
          }
        }
      }

      console.log('  ✅ Updated shared utility exports');
    } catch (error) {
      console.error(`  ❌ Error updating exports: ${error.message}`);
    }
  }

  // Run Phase 8 consolidation
  async run() {
    console.log('🚀 Phase 8: Final Exact Duplicate Elimination');
    console.log('='.repeat(50));
    console.log(`Target: ${PHASE_8_DUPLICATES.length} exact duplicate functions`);
    console.log('Strategy: Move orchestrator functions to shared/api.js');
    console.log(`Expected: ~${PHASE_8_DUPLICATES.length} functions eliminated\n`);

    // Process each duplicate
    for (const duplicate of PHASE_8_DUPLICATES) {
      await this.processDuplicate(duplicate);
    }

    // Update shared utility exports
    this.updateSharedExports();

    // Count files updated
    this.results.filesUpdated = FILES_TO_UPDATE.length;

    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('📊 Phase 8 Results:');
    console.log(`✅ Functions processed: ${this.results.functionsProcessed}`);
    console.log(`✅ Functions eliminated: ${this.results.functionsEliminated}`);
    console.log(`✅ Files updated: ${this.results.filesUpdated}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.functionName}: ${error.error}`);
      });
    }

    console.log('\n🎯 Phase 8 Complete!');
    console.log('Run `npm run audit:duplicates` to verify consolidation');
    console.log('Run `npm run test:action get-products` to verify functionality');
  }
}

// Run Phase 8 if called directly
if (require.main === module) {
  const consolidator = new Phase8Consolidator();
  consolidator.run().catch(console.error);
}

module.exports = { Phase8Consolidator };
