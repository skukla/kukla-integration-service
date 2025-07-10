/**
 * Format Domain Constants
 * Low-level formatting constants for consistent visual output
 * Shared infrastructure used across all script domains
 */

const chalk = require('chalk');

/**
 * Standard Icons (Unicode symbols for visual clarity)
 * Consistent iconography across all script output
 */
const ICONS = {
  // Operation status
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',

  // Process indicators
  loading: '⏳',
  complete: '✅',
  progress: '⟐',

  // Script lifecycle
  scriptStart: '🚀',
  scriptEnd: '🎉',

  // Operations
  build: '🔨',
  deploy: '🚀',
  test: '🧪',
  file: '📄',
  download: '⬇️',
  upload: '⬆️',

  // Environments
  staging: '🔧',
  production: '🌟',

  // Special
  mesh: '🔗',
  api: '⚡',
};

/**
 * Standard Colors (Consistent semantic usage)
 * Clear hierarchy and meaning through color
 */
const COLORS = {
  // Status colors (PRIMARY usage) - for operation results only
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,

  // Header colors (SECONDARY usage) - toned down for less emphasis
  header: chalk.cyan, // Lighter cyan for major sections
  subheader: chalk.gray, // Gray for sub-sections

  // Text colors (TERTIARY usage) - for content emphasis
  normal: chalk.white, // Normal text (default terminal color)
  muted: chalk.gray, // Less important info
  bold: chalk.bold, // Important emphasis
  highlight: chalk.bold.white, // Critical highlights

  // Special cases (MINIMAL usage)
  url: chalk.underline.blue, // URLs and links
};

/**
 * Standard Spacing
 * Consistent spacing patterns for visual hierarchy
 */
const SPACING = {
  // Vertical spacing
  section: '\n', // Between major sections
  subsection: '', // Between related items
  line: '\n', // Single line break

  // Horizontal spacing
  indent: '  ', // Standard indentation (2 spaces)
  doubleIndent: '    ', // Double indentation (4 spaces)

  // Padding
  beforeSection: '\n', // Before major sections
  afterSection: '\n', // After major sections
};

module.exports = {
  ICONS,
  COLORS,
  SPACING,
};
