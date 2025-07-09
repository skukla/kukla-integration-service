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

```javascript
const { FORMATTERS } = require('../core/operations/output-standards');

// Status messages
console.log(FORMATTERS.success('Operation completed'));
console.log(FORMATTERS.error('Operation failed'));
console.log(FORMATTERS.warning('Check configuration'));
console.log(FORMATTERS.info('Additional information'));

// Section headers
console.log(FORMATTERS.sectionHeader('Starting deployment', ICONS.deploy));

// Progress updates
console.log(FORMATTERS.progress('Processing files', 3, 10));
```

### Template Usage

```javascript
const { TEMPLATES } = require('../core/operations/output-standards');

// Pre-built templates
console.log(TEMPLATES.deploymentStart('staging'));
console.log(TEMPLATES.buildStart());
console.log(TEMPLATES.deploymentComplete('staging'));
```

### Environment Indicators

```javascript
const { FORMATTERS } = require('../core/operations/output-standards');

// Environment display with Unicode symbols
console.log(FORMATTERS.environment('staging'));    // ◉ Staging
console.log(FORMATTERS.environment('production')); // ● Production
```

## Migration Guide

### From Legacy Output

```javascript
// ❌ OLD: Hardcoded emojis and colors
console.log(chalk.green('🎉 Success!'));
console.log(chalk.red('❌ Failed'));

// ✅ NEW: Standardized formatters
console.log(FORMATTERS.success('Success!'));
console.log(FORMATTERS.error('Failed'));
```

### From Emoji-Heavy Output

```javascript
// ❌ OLD: Heavy emoji usage
console.log('🚀 Starting deployment...');
console.log('🔨 Building application...');
console.log('🎉 Deployment complete!');

// ✅ NEW: Professional Unicode symbols
console.log(FORMATTERS.sectionHeader('Starting deployment', ICONS.deploy));
console.log(FORMATTERS.sectionHeader('Building application', ICONS.build));
console.log(FORMATTERS.finalSuccess('Deployment complete!'));
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

1. **Always use formatters** instead of direct console.log with colors
2. **Choose appropriate icons** based on semantic meaning
3. **Maintain visual hierarchy** through consistent color usage
4. **Test output** across different terminal environments
5. **Update standards** when adding new output patterns

## Future Considerations

- Monitor Unicode symbol support across terminal environments
- Consider accessibility for color-blind users
- Evaluate new Unicode symbols as they become available
- Maintain backward compatibility with existing output patterns
