/**
 * Scripts Core Output Constants
 * Low-level constants for consistent visual output
 * Pure constants with no business logic - belongs in utils layer
 */

const chalk = require('chalk');

/**
 * Standard Icons (Professional Unicode symbols)
 * Consistent visual weight and cross-platform compatibility
 */
const ICONS = {
  // Status icons - thin checkmarks and crosses (PREFERRED)
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',

  // Process icons - clean Unicode symbols
  loading: '○', // Spinner base (ora handles animation)
  progress: '▸', // Progress indicator
  step: '→', // Step progression

  // Action icons - professional Unicode alternatives
  deploy: '▸', // Right arrow for deployment
  build: '⬢', // Hexagon for build processes
  update: '↻', // Clockwise open circle arrow for updates
  complete: '✔', // Success checkmark for completion

  // File operations - Unicode symbols
  file: '◦', // White bullet for files
  folder: '▫', // White square for folders
  download: '⇣', // Downward arrow
  upload: '⇡', // Upward arrow

  // Network/API - Unicode symbols
  api: '⟐', // White diamond for API
  mesh: '⬢', // Hexagon for mesh operations

  // Environment - Unicode symbols
  staging: '◉', // Fisheye for staging
  production: '●', // Black circle for production

  // Script lifecycle (OPTION 2: Minimal emoji for start/end only)
  scriptStart: '🚀', // Only for major script start
  scriptEnd: '🎉', // Only for major script completion
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
