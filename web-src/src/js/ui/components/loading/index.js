/**
 * Loading state management
 * @module ui/components/loading
 */

const LOADING_CONFIG = {
  CLASS: 'is-loading',
  SPINNER_CLASS: 'loading-spinner',
  ARIA_BUSY: 'aria-busy',
  ARIA_LABEL: 'aria-label',
};

/**
 * Show loading state on an element
 * @param {HTMLElement} element - Element to show loading on
 * @param {Object} options - Loading options
 * @param {string} [options.text] - Loading text to display
 * @param {string} [options.spinnerClass] - Custom spinner class
 * @param {boolean} [options.showSpinner=true] - Whether to show spinner
 */
export function showLoading(element, options = {}) {
  const { text, spinnerClass = LOADING_CONFIG.SPINNER_CLASS, showSpinner = true } = options;

  // Store original state
  element.dataset.originalText = element.innerText;
  element.dataset.originalAriaLabel = element.getAttribute(LOADING_CONFIG.ARIA_LABEL);

  // Add loading class
  element.classList.add(LOADING_CONFIG.CLASS);
  element.setAttribute(LOADING_CONFIG.ARIA_BUSY, 'true');

  // Update text if provided
  if (text) {
    element.innerText = text;
    element.setAttribute(LOADING_CONFIG.ARIA_LABEL, `Loading: ${text}`);
  }

  // Add spinner if enabled
  if (showSpinner) {
    const spinner = document.createElement('span');
    spinner.className = spinnerClass;
    spinner.setAttribute('aria-hidden', 'true');
    element.appendChild(spinner);
  }
}

/**
 * Hide loading state on an element
 * @param {HTMLElement} element - Element to hide loading from
 */
export function hideLoading(element) {
  // Remove loading class
  element.classList.remove(LOADING_CONFIG.CLASS);
  element.removeAttribute(LOADING_CONFIG.ARIA_BUSY);

  // Restore original text
  if (element.dataset.originalText) {
    element.innerText = element.dataset.originalText;
    delete element.dataset.originalText;
  }

  // Restore original aria-label
  const originalAriaLabel = element.dataset.originalAriaLabel;
  if (originalAriaLabel) {
    element.setAttribute(LOADING_CONFIG.ARIA_LABEL, originalAriaLabel);
  } else {
    element.removeAttribute(LOADING_CONFIG.ARIA_LABEL);
  }
  delete element.dataset.originalAriaLabel;

  // Remove spinner if present
  const spinner = element.querySelector(`.${LOADING_CONFIG.SPINNER_CLASS}`);
  if (spinner) {
    spinner.remove();
  }
}

/**
 * Check if an element is in loading state
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element is loading
 */
export function isLoading(element) {
  return element.classList.contains(LOADING_CONFIG.CLASS);
}
