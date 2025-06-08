/**
 * UI module exports
 * Re-exports all UI components and utilities
 * @module ui
 */

// Modal component
export {
  showModal,
  hideModal,
  createModal,
  initializeModal,
  handleModalContentSwap,
  handleModalBeforeSwap,
} from './components/modal/index.js';

// Notifications component
export {
  showNotification,
  clearNotifications,
  handleSuccessResult,
  handleErrorResult,
  handleDeleteResult,
} from './components/notifications/index.js';

// File browser
export {
  initializeFileBrowser,
  refreshFileList,
  handleFileOperationResult,
} from './file-browser/index.js';

// Downloads
export { processDownload, initializeDownloadHandlers } from './downloads/index.js';

// Loading components
export { showLoading, hideLoading, isLoading } from './components/loading/index.js';
