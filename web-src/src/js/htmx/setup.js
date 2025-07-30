/* HTMX Setup and Initialization */
import { initializeHtmxEvents } from './events.js';
import { getTimeout } from '../core/config/index.js';
import { getActionUrl } from '../core/url/index.js';
import { showNotification } from '../ui/components/notifications/index.js';
import { initializeDownloadHandlers } from '../ui/downloads/index.js';
// Component configuration
const COMPONENT_CONFIG = {
  'file-list': {
    'hx-get': () => getActionUrl('browse-files'),
    'hx-trigger': 'never', // DISABLED: Was 'load once' - preventing interference with delete operations
    'hx-swap': 'innerHTML',
    'hx-indicator': '#content-loader',
    'hx-disable-preserve-focus': 'true',
    'data-loading-states': 'true',
  },
  'content-loader': {
    'hx-target': '.table-content',
    'hx-swap': 'innerHTML',
    'hx-indicator': '#content-loader',
    'hx-disable-preserve-focus': 'true',
    'data-loading-class': 'is-loading',
    'data-loading-states': 'true',
  },
  modal: {
    'hx-swap-oob': 'true',
    'data-loading-states': 'true',
    'data-loading-class': 'is-loading',
    role: 'dialog',
    'aria-modal': 'true',
  },
  'delete-button': {
    'hx-get': (el) =>
      getActionUrl('delete-file', {
        fileName: el.dataset.fileName,
        fullPath: el.dataset.downloadUrl,
      }),
    'hx-target': '#modal-container',
    'hx-swap': 'innerHTML',
    'data-loading-class': 'is-loading',
    'data-loading-states': 'true',
    'data-success-message': (el) => `${el.dataset.fileName} deleted successfully`,
  },
};
// HTMX configuration
const HTMX_CONFIG = {
  timeout: getTimeout(), // From performance configuration
  historyCacheSize: 0, // DISABLE CACHE - force real HTTP requests
  defaultSwapStyle: 'innerHTML', // Default swap style
  defaultSettleDelay: 0, // No settle delay for immediate feedback
  defaultSwapDelay: 0, // No delay for immediate response
  includeIndicatorStyles: false, // We use our own indicators
  globalViewTransitions: false, // Disable view transitions to prevent overlay effects
  allowScriptTags: false, // Security: don't allow script tags
  allowEval: false, // Security: don't allow eval
  methodsThatUseUrlParams: ['get', 'post'], // Allow both GET and POST to use URL params
  getCacheBusterParam: false, // Disable automatic cache busting
  refreshOnHistoryMiss: false, // Don't refresh on cache miss
  // Progressive loading configuration
  progressiveLoadDelay: 100, // Delay before checking for more content
  loadingClass: 'is-loading', // Class for loading indicators
  progressiveLoadDistance: 200, // Pixels from bottom to trigger load
};
// Loading states extension configuration
const LOADING_STATES_CONFIG = {
  class: 'is-loading',
  indicatorClass: 'loading-indicator',
  requestClass: 'loading-request',
  addedClass: 'loading-added',
  removedClass: 'loading-removed',
  additiveClass: 'loading-additive',
  onEvent: function (name, evt) {
    let elt = evt.detail.elt;
    let loadingClass = elt.getAttribute('data-loading-class') || this.class;
    if (name === 'htmx:beforeRequest' && loadingClass) {
      elt.classList.add(loadingClass);
    }
    if ((name === 'htmx:afterRequest' || name === 'htmx:timeout') && loadingClass) {
      elt.classList.remove(loadingClass);
    }
  },
};
// Class tools extension configuration
const CLASS_TOOLS_CONFIG = {
  addedClass: 'class-added',
  removedClass: 'class-removed',
  additiveClass: 'class-additive',
};
/**
 * Initialize HTMX configuration and extensions
 */
export function initializeHtmx() {
  if (!window.htmx) {
    return;
  }
  // Configure HTMX
  window.htmx.config = {
    ...HTMX_CONFIG,
    defaultSwapStyle: 'innerHTML',
    withCredentials: false, // Disable credentials globally to avoid CORS issues
    timeout: getTimeout(),
    wsReconnectDelay: 'full-jitter',
    defaultSwapDelay: 0, // No swap delay for immediate UI updates
    // Allow requests to different origins since Adobe I/O Runtime uses wildcard CORS
    selfRequestsOnly: false,
  };
  // Initialize extensions
  window.htmx.defineExtension('loading-states', LOADING_STATES_CONFIG);
  window.htmx.defineExtension('class-tools', CLASS_TOOLS_CONFIG);
  // Initialize event handlers
  initializeHtmxEvents();
  initializeDownloadHandlers(window.htmx);
  // Initialize components
  initializeComponents();
  // Set up progressive loading
  setupProgressiveLoading();
}
/**
 * Initialize all HTMX components
 */
function initializeComponents() {
  // Find all components
  document.querySelectorAll('[data-component]').forEach((element) => {
    const componentType = element.dataset.component;
    const config = COMPONENT_CONFIG[componentType];
    if (!config) {
      showNotification(`Component type "${componentType}" not configured`, 'warning');
      return;
    }
    // Apply configuration
    Object.entries(config).forEach(([attr, value]) => {
      const attrValue = typeof value === 'function' ? value(element) : value;
      element.setAttribute(attr, attrValue);
    });
    // Process the element with HTMX
    window.htmx.process(element);
  });
}
/**
 * Configure a new component with HTMX attributes
 * @param {HTMLElement} element - The element to configure
 * @param {string} componentType - The type of component to configure
 */
export function configureComponent(element, componentType) {
  const config = COMPONENT_CONFIG[componentType];
  if (!config) {
    return;
  }
  // Apply configuration
  Object.entries(config).forEach(([attr, value]) => {
    const attrValue = typeof value === 'function' ? value(element) : value;
    element.setAttribute(attr, attrValue);
  });
  // Process the element with HTMX
  window.htmx.process(element);
}
/**
 * Set up progressive loading functionality
 */
function setupProgressiveLoading() {
  function shouldLoadMore(trigger) {
    if (!trigger || !trigger.hasAttribute('data-progressive-load')) return false;
    const rect = trigger.getBoundingClientRect();
    const bottomPosition = rect.bottom;
    const windowHeight = window.innerHeight;
    return bottomPosition - windowHeight <= HTMX_CONFIG.progressiveLoadDistance;
  }
  window.htmx.on('htmx:afterSettle', function (evt) {
    const trigger = evt.detail.target;
    if (!trigger || !trigger.hasAttribute('data-progressive-load')) return;
    setTimeout(() => {
      if (shouldLoadMore(trigger)) {
        window.htmx.trigger(trigger, 'revealed');
      }
    }, HTMX_CONFIG.progressiveLoadDelay);
  });
  window.addEventListener(
    'scroll',
    function () {
      const triggers = document.querySelectorAll('[data-progressive-load][hx-trigger*="revealed"]');
      triggers.forEach((trigger) => {
        if (shouldLoadMore(trigger)) {
          window.htmx.trigger(trigger, 'revealed');
        }
      });
    },
    { passive: true }
  );
}
export default {
  HTMX_CONFIG,
  initializeHtmx,
};
