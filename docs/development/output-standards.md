# Script Output Standards

## Overview

This document defines the visual standards for all script output in the Adobe App Builder kukla-integration-service project. These standards ensure consistent, professional appearance across build, deploy, and test scripts while maintaining excellent cross-platform compatibility.

## Design Philosophy

### Unicode-First Approach

- **Professional Unicode symbols** instead of heavy emojis
- **Consistent visual weight** across all indicators
- **Cross-platform compatibility** with terminal fonts
- **Semantic meaning** through symbol choice and color

### Visual Hierarchy

1. **Status indicators** (✔ ✖ ⚠ ℹ) - Primary visual cues
2. **Process indicators** (▸ ○ →) - Secondary workflow cues
3. **Action indicators** (⬢ ↻) - Tertiary operation cues
4. **Context indicators** (◉ ●) - Environment and type cues

## Icon Standards

### Status Icons (Primary)

```text
✔  Success      - Thin checkmark for completed operations
✖  Error        - Thin X for failed operations  
⚠  Warning      - Triangle for caution/warnings
ℹ  Info         - Lowercase i for informational messages
```

### Process Icons (Secondary)

```text
○  Loading      - Circle for spinner base (ora handles animation)
▸  Progress     - Right arrow for progress/deployment
→  Step         - Right arrow for step progression
```

### Action Icons (Tertiary)

```text
▸  Deploy       - Right arrow for deployment operations
⬢  Build        - Hexagon for build processes
↻  Update       - Clockwise arrow for updates/refresh
✔  Complete     - Success checkmark for completion
```

### File Operations

```text
◦  File         - White bullet for files
▫  Folder       - White square for folders
⇣  Download     - Downward arrow for downloads
⇡  Upload       - Upward arrow for uploads
```

### Network/API

```text
⟐  API          - White diamond for API operations
⬢  Mesh         - Hexagon for mesh operations
```

### Environment

```text
◉  Staging      - Fisheye for staging environment
●  Production   - Black circle for production environment
```

## Color Standards

### Semantic Color Usage

```javascript
// Status colors (PRIMARY usage)
success: chalk.green     // ✔ operations that completed successfully
error: chalk.red         // ✖ operations that failed
warning: chalk.yellow    // ⚠ operations needing attention
info: chalk.blue         // ℹ informational messages

// Process colors (SECONDARY usage)
header: chalk.bold.cyan      // Section headers only
subheader: chalk.cyan        // Sub-sections only
muted: chalk.gray           // Less important information

// Text emphasis (TERTIARY usage)
bold: chalk.bold            // Important text emphasis
highlight: chalk.bold.white // Critical highlights
url: chalk.underline.blue   // URLs and links
```

### Color Usage Rules

1. **Status colors** for operation results only
2. **Header colors** for section organization only
3. **Muted colors** for supplementary information
4. **No arbitrary colors** - stick to semantic meanings

## Usage Examples

### Basic Formatting

**SIMPLE RULE: All format functions return strings. Always use `console.log()` to print.**

```javascript
const format = require('../../scripts/format');

// Basic formatting - ALL RETURN STRINGS
console.log(format.success('Operation completed'));
console.log(format.error('Operation failed'));
console.log(format.warning('Check configuration'));
console.log(format.info('Additional information'));

// Section formatting - RETURNS STRINGS
console.log(format.section('Starting deployment'));
console.log(format.header('Processing Files'));

// Lifecycle formatting - RETURNS STRINGS
console.log(await format.buildStart());
console.log(await format.buildDone());
console.log(await format.deployStart(environment));
console.log(await format.deployDone(environment));

// Common operations - RETURNS STRINGS
console.log(format.verbose('Processing step 1...'));
console.log(format.step('Environment validated'));
```

**Why This Pattern:**

- Zero cognitive load (same pattern everywhere)
- Pure functions (easy to test and compose)
- Industry standard (how most logging libraries work)
- Flexible (can redirect output, save to files, use in tests)

## Migration Guide

### From Mixed Patterns (Confusing)

```javascript
// ❌ OLD: Inconsistent patterns
console.log(format.error('Build failed'));     // String returner
format.verbose('Starting mesh update...');     // Direct printer
console.log(await format.buildStart());        // String returner
format.section('Deploying App Builder');       // Direct printer

// ✅ NEW: Consistent pattern (simple)
console.log(format.error('Build failed'));
console.log(format.verbose('Starting mesh update...'));
console.log(await format.buildStart());
console.log(format.section('Deploying App Builder'));
```

### From Legacy Output

```javascript
// ❌ OLD: Hardcoded emojis and colors
console.log(chalk.green('🎉 Success!'));
console.log(chalk.red('❌ Failed'));

// ✅ NEW: Format domain functions
console.log(format.success('Success!'));
console.log(format.error('Failed'));
```

### From Direct chalk Usage

```javascript
// ❌ OLD: Direct chalk usage scattered throughout code
console.log(chalk.cyan('🚀 Starting deployment...'));
console.log(chalk.yellow('⚠ Warning: Check configuration'));

// ✅ NEW: Centralized format domain
console.log(format.section('Starting deployment'));
console.log(format.warning('Warning: Check configuration'));
```

## Benefits

### Professional Appearance

- Clean, consistent visual weight
- Professional Unicode symbols
- Semantic color usage
- Cross-platform compatibility

### Developer Experience

- Consistent formatting across all scripts
- Easy-to-use formatter functions
- Pre-built templates for common scenarios
- Clear visual hierarchy

### Maintainability

- Single source of truth for all visual standards
- Easy to update styles globally
- Consistent patterns across the codebase
- Self-documenting through semantic naming

## Implementation Notes

### Spinner Integration

- Uses `○` as base symbol for ora spinners
- Maintains consistent visual weight with other icons
- Seamless integration with existing spinner system

### Cross-Platform Compatibility

- All Unicode symbols tested across major terminals
- Fallback-safe symbol choices
- Consistent rendering on macOS, Linux, and Windows

### Performance

- Minimal overhead from chalk color formatting
- Efficient symbol rendering
- No external dependencies beyond chalk

## Best Practices

1. **SIMPLE RULE**: All format functions return strings, always use `console.log()` to print
2. **Use format domain**: Import `const format = require('../../scripts/format')` instead of direct chalk
3. **Consistent pattern**: `console.log(format.functionName())` everywhere, no exceptions
4. **Choose appropriate functions** based on semantic meaning (success, error, warning, info)
5. **Test output** across different terminal environments
6. **Update centrally** - all formatting changes go in the format domain only

## Future Considerations

- Monitor Unicode symbol support across terminal environments
- Consider accessibility for color-blind users
- Evaluate new Unicode symbols as they become available
- Maintain backward compatibility with existing output patterns
