/* HTMX Configuration and Initialization */
import { initializeHtmxEvents } from './events.js';
import { showNotification } from '../core/notifications.js';
import { getActionUrl } from '../core/urls.js';
import { showLoading, hideLoading } from '../core/loading.js';

// Component configuration
const COMPONENT_CONFIG = {
    'file-list': {
        'hx-get': () => getActionUrl('browse-files'),
        'hx-trigger': 'load',
        'hx-swap': 'innerHTML',
        'hx-indicator': '.table-row.is-skeleton'
    },
    'content-loader': {
        'hx-get': () => getActionUrl('browse-files'),
        'hx-trigger': 'load delay:2s',
        'hx-target': '.table-content',
        'hx-swap': 'innerHTML',
        'hx-indicator': '.table-row.is-skeleton',
        'data-loading-class': 'is-loading'
    },
    'delete-button': {
        'hx-get': (el) => getActionUrl('browse-files', {
            modal: 'delete',
            fileName: el.dataset.fileName,
            fullPath: el.dataset.downloadUrl
        }),
        'hx-target': '#modal-container',
        'hx-swap': 'innerHTML',
        'data-loading-class': 'is-loading',
        'data-success-message': 'File deleted successfully'
    }
};

// HTMX configuration
const HTMX_CONFIG = {
    timeout: 30000,                  // 30 second timeout
    historyCacheSize: 10,            // Keep last 10 pages in cache
    defaultSwapStyle: 'innerHTML',   // Default swap style
    defaultSettleDelay: 20,          // Small delay for smooth transitions
    includeIndicatorStyles: false,   // We use our own indicators
    globalViewTransitions: true,     // Enable view transitions API
    allowScriptTags: false,          // Security: don't allow script tags
    allowEval: false,                // Security: don't allow eval
    methodsThatUseUrlParams: ['get'], // Only GET uses URL params
    
    // Progressive loading configuration
    progressiveLoadDelay: 100,    // Delay before checking for more content
    loadingClass: 'is-loading',   // Class for loading indicators
    progressiveLoadDistance: 200  // Pixels from bottom to trigger load
};

/**
 * Initialize HTMX configuration and extensions
 */
export function initializeHtmx() {
    if (!window.htmx) {
        console.error('HTMX not found. Make sure it is loaded before initializing.');
        return;
    }

    // Configure HTMX
    window.htmx.config = HTMX_CONFIG;

    // Add custom attributes
    window.htmx.defineAttribute('loading-class', {
        onEvent: function(name, evt) {
            const elt = evt.detail.elt;
            if (name === 'htmx:beforeRequest') {
                elt.classList.add(HTMX_CONFIG.loadingClass);
            } else if (name === 'htmx:afterRequest') {
                elt.classList.remove(HTMX_CONFIG.loadingClass);
            }
        }
    });

    // Add progressive loading support
    setupProgressiveLoading();

    // Add loading state handlers
    setupLoadingHandlers();

    // Initialize loading states extension
    window.htmx.defineExtension('loading-states', {
        onEvent: function(name, evt) {
            const target = evt.detail.elt;
            const loadingClass = target.getAttribute('data-loading-class') || 'loading';
            
            if (name === "htmx:beforeRequest") {
                target.classList.add(loadingClass);
                
                // Handle loading text if specified
                const loadingText = target.getAttribute('data-loading-text');
                if (loadingText) {
                    target.dataset.originalText = target.innerText;
                    target.innerText = loadingText;
                }
            }
            
            if (name === "htmx:afterRequest") {
                target.classList.remove(loadingClass);
                
                // Restore original text
                if (target.dataset.originalText) {
                    target.innerText = target.dataset.originalText;
                    delete target.dataset.originalText;
                }
            }
        }
    });

    // Initialize focus management extension
    window.htmx.defineExtension('focus-management', {
        onEvent: function(name, evt) {
            if (name === "htmx:afterSettle") {
                // Find and focus the first focusable element
                const focusable = evt.detail.target.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable) {
                    focusable.focus();
                }
            }
        }
    });

    // Add security headers to all requests
    window.htmx.on('htmx:configRequest', (evt) => {
        evt.detail.headers = evt.detail.headers || {};
        evt.detail.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            evt.detail.headers['X-CSRF-Token'] = csrfToken.content;
        }
    });

    // Initialize all HTMX event handlers
    initializeHtmxEvents();

    // Initialize components
    initializeComponents();

    // Enable debug logging in development
    if (process.env.NODE_ENV === 'development') {
        window.htmx.logAll();
    }
}

/**
 * Initialize all HTMX components
 */
function initializeComponents() {
    // Find all components
    document.querySelectorAll('[data-component]').forEach(element => {
        const componentType = element.dataset.component;
        const config = COMPONENT_CONFIG[componentType];
        
        if (!config) {
            console.warn(`No configuration found for component type: ${componentType}`);
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
        console.warn(`No configuration found for component type: ${componentType}`);
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
    // Check if more content should be loaded
    function shouldLoadMore(trigger) {
        if (!trigger) return false;

        const rect = trigger.getBoundingClientRect();
        const bottomPosition = rect.bottom;
        const windowHeight = window.innerHeight;

        return bottomPosition - windowHeight <= HTMX_CONFIG.progressiveLoadDistance;
    }

    // Handle progressive loading check
    window.htmx.on('htmx:afterSettle', function(evt) {
        const trigger = evt.detail.target;
        
        // Check if this is a progressive load target
        if (!trigger || !trigger.hasAttribute('hx-trigger')) return;

        // Delay check to avoid rapid requests
        setTimeout(() => {
            if (shouldLoadMore(trigger)) {
                window.htmx.trigger(trigger, 'revealed');
            }
        }, HTMX_CONFIG.progressiveLoadDelay);
    });

    // Add scroll handler for progressive loading
    window.addEventListener('scroll', function() {
        const triggers = document.querySelectorAll('[hx-trigger="revealed"]');
        triggers.forEach(trigger => {
            if (shouldLoadMore(trigger)) {
                window.htmx.trigger(trigger, 'revealed');
            }
        });
    }, { passive: true });
}

/**
 * Set up loading state handlers
 */
function setupLoadingHandlers() {
    // Show loading state
    window.htmx.on('htmx:beforeRequest', function(evt) {
        const target = evt.detail.target;
        showLoading(target);
    });

    // Hide loading state
    window.htmx.on('htmx:afterRequest', function(evt) {
        const target = evt.detail.target;
        hideLoading(target);
    });

    // Handle errors
    window.htmx.on('htmx:responseError', function(evt) {
        const target = evt.detail.target;
        hideLoading(target);
    });

    // Handle timeouts
    window.htmx.on('htmx:timeout', function(evt) {
        const target = evt.detail.target;
        hideLoading(target);
    });
}

export default {
    HTMX_CONFIG,
    initializeHtmx
}; 