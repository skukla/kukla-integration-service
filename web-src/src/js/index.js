/**
 * Main application exports
 * Entry point for the frontend application
 * @module app
 */

// Core functionality
export * as core from './core/index.js';

// UI components
export * as ui from './ui/index.js';

// HTMX integration
export * as htmx from './htmx/index.js';

// Individual module exports for convenience
export { initializeHTMX } from './htmx/index.js';
export {
  initializeModal,
  initializeFileBrowser,
  showNotification,
  showModal,
  hideModal,
} from './ui/index.js';
export {
  getActionUrl,
  loadConfig,
  getRuntimeConfig,
  isStaging,
  isProduction,
} from './core/index.js';
