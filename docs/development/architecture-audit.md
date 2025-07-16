# Architecture Audit System

## Overview

The Architecture Audit System is a comprehensive tool that validates compliance with the **Feature-First DDD + Domain standards** documented in `ARCHITECTURE-STANDARDS.md`. It provides automated checking of architectural patterns, code organization, and development standards across the entire codebase.

## Quick Start

```bash
# Run full audit
npm run audit

# Run with detailed output
npm run audit:verbose

# Run only CI/CD gate checks (fastest)
npm run audit:tier1

# Run pattern detection warnings
npm run audit:tier2

# Run manual review suggestions
npm run audit:tier3
```

## Three-Tier Audit System

### Tier 1: High Reliability (CI/CD Gate) ⚡
**90-100% accurate | Build fails on violations**

These rules are **enforced** and will fail your build/commit if violated:

- **File Structure Compliance** - Domain organization, Feature-First patterns
- **Import Organization** - Three-tier import sections, top-of-file placement
- **Export Patterns** - Proper module.exports structure and grouping
- **Action Framework Compliance** - createAction() usage, no manual main() exports
- **Naming Conventions** - camelCase functions, kebab-case files
- **JSDoc Documentation** - Function documentation, "Used by:" comments
- **Step Comments** - Workflow functions have "Step N:" patterns
- **File Headers** - Descriptive comments for large files

**Use Case:** Pre-commit hooks, CI/CD pipelines, build gates

### Tier 2: Pattern Detection (Warnings) 🎯
**70-90% accurate | Reports issues but doesn't fail builds**

These rules identify potential problems and guide improvements:

- **Function Length Guidelines** - Target 10-40 lines, max 60 lines
- **File Size Limits** - Target 150-400 lines, max 600 lines  
- **Configuration Access Patterns** - No optional chaining with fallbacks
- **Error Handling Patterns** - Three-tier error handling usage
- **Feature-First Organization** - Composite → atomic ordering within files

**Use Case:** Code review guidance, quality monitoring, technical debt tracking

### Tier 3: Manual Review Flags (Guidance) 🚨
**Guidance only | Identifies areas for human review**

These rules flag areas that require human judgment:

- **Complex Business Logic** - High cyclomatic complexity, nested conditions
- **Potential Cognitive Load** - Mixed abstraction levels, high coupling
- **Cross-Domain Dependencies** - Potential DDD boundary violations
- **Abstraction Opportunities** - Repeated patterns, similar function names

**Use Case:** Architecture reviews, refactoring planning, design discussions

## Integration Points

### 1. Pre-Commit Hooks (Automatic)

The audit system is integrated with Husky and runs automatically on every commit:

```bash
# Triggered automatically on git commit
git commit -m "feature: add new functionality"
# → Runs ESLint, Prettier, and Architecture Audit (Tier 1 only)
```

**Bypass for emergencies:**
```bash
git commit --no-verify -m "hotfix: emergency fix"
```

### 2. Build Process Integration

Add to your build scripts for comprehensive validation:

```bash
# In your deployment pipeline
npm run audit          # Full audit before deploy
npm run audit:tier1     # Quick gate check
```

### 3. IDE Integration

**VS Code Integration (Recommended):**

Add to `.vscode/tasks.json`:
```json
{
  "label": "Architecture Audit",
  "type": "shell",
  "command": "npm run audit:verbose",
  "group": "build",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "panel": "new"
  }
}
```

**Keyboard Shortcut:**
- `Cmd/Ctrl + Shift + P` → "Tasks: Run Task" → "Architecture Audit"

### 4. CI/CD Pipeline Integration

**GitHub Actions Example:**
```yaml
- name: Architecture Audit
  run: |
    npm ci
    npm run audit:tier1  # Only fail on Tier 1 issues
    npm run audit        # Full report (warnings only)
```

**Jenkins Example:**
```groovy
stage('Architecture Audit') {
  steps {
    sh 'npm run audit:tier1'
    publishHTML([
      allowMissing: false,
      alwaysLinkToLastBuild: true,
      keepAll: true,
      reportDir: 'audit-reports',
      reportFiles: 'audit-report.html',
      reportName: 'Architecture Audit Report'
    ])
  }
}
```

## Configuration

### Rule Customization

Edit `audit.config.js` to customize rules, severity levels, and options:

```javascript
// audit.config.js
module.exports = {
  rules: {
    tier1: {
      rules: {
        'file-structure-compliance': {
          enabled: true,
          severity: 'error',
          options: {
            validDomains: ['products', 'files', 'commerce', 'htmx', 'shared'],
            // Add custom domains here
            customDomains: ['analytics', 'monitoring']
          }
        },
        'function-length-guidelines': {
          enabled: true,
          options: {
            targetMaxLines: 30, // Stricter than default 40
            absoluteMaxLines: 50 // Stricter than default 60
          }
        }
      }
    }
  }
};
```

### File Pattern Customization

Adjust which files are audited:

```javascript
// audit.config.js
module.exports = {
  patterns: {
    include: [
      'src/**/*.js',
      'actions/**/*.js',
      'custom-directory/**/*.js' // Add custom directories
    ],
    exclude: [
      'legacy/**', // Exclude legacy code
      'third-party/**', // Exclude vendor code
      'generated/**' // Exclude auto-generated files
    ]
  }
};
```

### Team-Specific Settings

**For Strict Teams:**
```javascript
// Fail builds on Tier 2 warnings
rules: {
  tier2: {
    failOnError: true // Default: false
  }
}
```

**For Legacy Codebases:**
```javascript
// Gradual adoption approach
rules: {
  tier1: {
    rules: {
      'jsdoc-documentation': {
        enabled: false // Temporarily disable while adding docs
      },
      'step-comments': {
        enabled: false // Add step comments incrementally
      }
    }
  }
}
```

## Output Formats

### Console Output (Default)
```bash
npm run audit
# → Colorized console output with summaries and details
```

### JSON Output (for tools)
```bash
npm run audit -- --format=json > audit-results.json
```

### Verbose Output (detailed analysis)
```bash
npm run audit:verbose
# → Shows file statistics, performance metrics, and detailed rule explanations
```

## Understanding Audit Results

### Exit Codes
- `0` - Success (all checks passed)
- `1` - Tier 1 failures (build should fail)
- `2` - Audit execution error

### Reading Reports

**Summary Section:**
```
📊 ARCHITECTURE AUDIT REPORT
════════════════════════════════════════════════════════════════════════════════

🎯 SUMMARY
   Total Files Analyzed: 45
   Total Checks: 1,200
   Duration: 2,341ms
   Overall: 1,150/1,200 checks passed (96%)

⚡ TIER 1 - High Reliability (CI/CD Gate)
   Passed: 380
   Failed: 5
   Status: ❌ FAIL
```

**Detailed Issues:**
```
📋 DETAILED ISSUES

❌ import-organization (3 files)
   📁 src/products/product-enrichment.js
      • All require() statements must be at the top of the file before any other code
      • Missing import organization sections. Must include INFRASTRUCTURE DEPENDENCIES

⚠️ function-length-guidelines (2 files)
   📁 src/files/csv-export.js
      • Function 'exportComplexCsv' is 65 lines (max recommended: 60)
```

## Best Practices

### 1. Run Audits Regularly
```bash
# Daily development workflow
npm run audit:tier1    # Quick check
npm run audit:tier2    # Code quality check
git commit             # Automatic Tier 1 check
```

### 2. Address Issues by Priority
1. **Fix Tier 1 issues immediately** (build blockers)
2. **Plan Tier 2 fixes** (code quality improvements)
3. **Review Tier 3 flags** (architectural considerations)

### 3. Use Audit Results for Planning
- **Technical Debt:** Track Tier 2 warnings over time
- **Architecture Reviews:** Use Tier 3 flags for discussion points
- **Code Quality Metrics:** Monitor overall pass rates

### 4. Team Adoption Strategy

**Week 1-2: Enable Tier 1 Rules Gradually**
```bash
# Start with just file structure and imports
npm run audit:tier1 -- --rules=file-structure,import-organization
```

**Week 3-4: Add Documentation Rules**
```bash
# Add JSDoc and step comments
npm run audit:tier1 -- --rules=jsdoc-documentation,step-comments
```

**Week 5+: Full Tier 1 Enforcement**
```bash
# Enable all Tier 1 rules
npm run audit:tier1
```

## Troubleshooting

### Common Issues

**1. "All require() statements must be at the top"**
```javascript
// ❌ WRONG: Inline require
function someFunction() {
  const util = require('util');
}

// ✅ CORRECT: Top-of-file require
const util = require('util');

function someFunction() {
  // Use util here
}
```

**2. "Missing import organization sections"**
```javascript
// ❌ WRONG: No section headers
const fs = require('fs');
const { createAction } = require('../shared/action');

// ✅ CORRECT: With section headers
// === INFRASTRUCTURE DEPENDENCIES ===
const fs = require('fs');

// === DOMAIN DEPENDENCIES ===
const { createAction } = require('../shared/action');
```

**3. "Action must use createAction() framework"**
```javascript
// ❌ WRONG: Manual main export
async function main(params) {
  // action logic
}
module.exports = { main };

// ✅ CORRECT: createAction framework
const { createAction } = require('../shared/action');

async function businessLogic(context) {
  // action logic
}

module.exports = createAction(businessLogic, {
  actionName: 'my-action',
  description: 'Action description'
});
```

### Performance Issues

**Slow audit execution:**
```bash
# Run only on changed files
npm run audit:tier1 -- --changed-only

# Skip file discovery cache
npm run audit:tier1 -- --no-cache

# Parallel execution
npm run audit:tier1 -- --parallel
```

### False Positives

**Temporarily disable specific rules:**
```javascript
// At the top of problematic files
/* eslint-disable audit/rule-name */

// Or configure in audit.config.js
rules: {
  tier1: {
    rules: {
      'problematic-rule': {
        enabled: false,
        reason: 'Temporary disable due to legacy code refactoring'
      }
    }
  }
}
```

## Advanced Usage

### Custom Rules

Create custom audit rules for team-specific standards:

```javascript
// audit.config.js
const customRule = require('./custom-rules/my-rule');

module.exports = {
  extensions: {
    customRules: [
      {
        name: 'my-custom-rule',
        tier: 1,
        enabled: true,
        severity: 'error',
        implementation: customRule
      }
    ]
  }
};
```

### Integration with Other Tools

**ESLint Integration:**
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['audit'],
  rules: {
    'audit/architecture-compliance': 'error'
  }
};
```

**VS Code Extension:**
```json
// .vscode/settings.json
{
  "audit.enableBackgroundChecking": true,
  "audit.tier1OnSave": true,
  "audit.showInlineHints": true
}
```

## Migration Guide

### From Manual Reviews to Automated Audits

**Phase 1: Assessment (Week 1)**
```bash
npm run audit -- --report-only
# Generate baseline report, don't fail builds
```

**Phase 2: Gradual Enforcement (Weeks 2-4)**
```bash
# Enable rules incrementally
npm run audit:tier1 -- --rules=file-structure
npm run audit:tier1 -- --rules=file-structure,imports
npm run audit:tier1 -- --rules=file-structure,imports,exports
```

**Phase 3: Full Enforcement (Week 5+)**
```bash
# Enable pre-commit hooks
npm run audit:tier1  # Full Tier 1 enforcement
```

### From Legacy Architecture to Feature-First DDD

**1. Run Assessment:**
```bash
npm run audit:tier3
# Identify cross-domain dependencies and abstraction opportunities
```

**2. Plan Refactoring:**
- Use Tier 3 flags to identify files for refactoring
- Prioritize by cognitive load and complexity scores
- Plan domain boundary consolidation

**3. Execute Incrementally:**
- Refactor one domain at a time
- Enable Tier 1 rules for refactored domains
- Keep legacy domains temporarily excluded

## Support and Contributing

### Getting Help

1. **Check documentation:** This file and `ARCHITECTURE-STANDARDS.md`
2. **Review audit.config.js:** Most issues can be resolved with configuration
3. **Run with verbose output:** `npm run audit:verbose` for detailed diagnostics
4. **Check GitHub issues:** Known issues and solutions

### Contributing Rules

1. **Propose new rules** via GitHub issues with:
   - Business justification
   - Accuracy assessment (Tier 1/2/3)
   - Implementation approach
   - Test cases

2. **Submit rule implementations** with:
   - Comprehensive test coverage
   - Documentation updates
   - Performance benchmarks

### Feedback and Improvements

The audit system is designed to evolve with the team's needs. Please provide feedback on:

- **Rule accuracy:** False positives/negatives
- **Performance:** Execution time and resource usage  
- **Usability:** CLI experience and integration points
- **Coverage:** Missing architectural patterns or standards

**Remember:** The audit system exists to **support** development, not hinder it. All rules and configurations should make development more efficient and maintainable. 