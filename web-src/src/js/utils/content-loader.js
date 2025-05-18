/* Content Loading Utilities */

/**
 * Initializes a delayed content loader with HTMX attributes
 * @param {string} loaderId - The ID of the loader element
 * @param {Object} options - Configuration options
 * @param {string} options.url - The URL to fetch content from
 * @param {string} options.target - The target selector where content will be inserted
 * @param {string} options.swap - The HTMX swap method to use
 * @param {number} options.delay - Delay in milliseconds before loading content
 */
export function initializeDelayedLoader(loaderId, { url, target, swap = 'innerHTML', delay = 1000 }) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loader = document.getElementById(loaderId);
            if (!loader) return;

            loader.setAttribute('hx-get', url);
            loader.setAttribute('hx-trigger', 'load');
            loader.setAttribute('hx-target', target);
            loader.setAttribute('hx-swap', swap);
            htmx.process(loader);
        }, delay);
    });
} 