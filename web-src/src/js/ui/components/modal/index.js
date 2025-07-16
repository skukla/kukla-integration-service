/**
 * Modal System
 * @module ui/components/modal
 */

import { getConfig } from '../../../core/config/index.js';

// Modal configuration
const MODAL_CONFIG = {
  CONTAINER_ID: 'modal-container',
  BACKDROP_CLASS: 'modal-backdrop',
  MODAL_CLASS: 'modal',
  ACTIVE_CLASS: 'active',
  ANIMATION_DURATION: 300,
  Z_INDEX: (() => {
    try {
      const config = getConfig();
      return config.ui.modal.zIndex;
    } catch (error) {
      return 1000; // Fallback if config fails
    }
  })(),
};

let activeModal = null;
let previousFocus = null;

/**
 * Show the modal
 */
export function showModal() {
  const backdrop = document.querySelector(`.${MODAL_CONFIG.BACKDROP_CLASS}`);
  const container = document.getElementById(MODAL_CONFIG.CONTAINER_ID);
  if (!backdrop || !container) return;

  // Store current focus
  previousFocus = document.activeElement;

  // Show modal backdrop
  backdrop.classList.add(MODAL_CONFIG.ACTIVE_CLASS);
  activeModal = backdrop;

  // Focus first focusable element
  focusFirstElement();

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  backdrop.addEventListener('click', handleBackdropClick);
  document.body.style.overflow = 'hidden';
}

/**
 * Hide the modal
 */
export function hideModal() {
  if (!activeModal) return;

  // Hide modal backdrop
  activeModal.classList.remove(MODAL_CONFIG.ACTIVE_CLASS);

  // Restore focus
  if (previousFocus) {
    previousFocus.focus();
  }

  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown);
  activeModal.removeEventListener('click', handleBackdropClick);
  document.body.style.overflow = '';

  activeModal = null;
  previousFocus = null;
}

/**
 * Handle backdrop click to close modal
 * @param {Event} event - The click event
 */
function handleBackdropClick(event) {
  // Only close if clicking the backdrop itself, not its children
  if (event.target === activeModal) {
    hideModal();
  }
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
  if (!activeModal) return;

  switch (event.key) {
    case 'Escape':
      hideModal();
      break;
    case 'Tab':
      handleTabKey(event);
      break;
  }
}

/**
 * Handle tab key for focus trapping
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleTabKey(event) {
  const focusableElements = getFocusableElements();
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement) return;

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * Get all focusable elements in the modal
 * @returns {Array<HTMLElement>} Array of focusable elements
 */
function getFocusableElements() {
  if (!activeModal) return [];

  return Array.from(
    activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

/**
 * Focus the first focusable element in the modal
 */
function focusFirstElement() {
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Handle modal content swap
 * @param {Event} event - HTMX afterSwap event
 */
export function handleModalContentSwap(event) {
  // Only show modal if:
  // 1. Content is being swapped into the modal container
  // 2. The content contains actual modal content (not just initialization)
  // 3. The swap is intentional (has modal-specific attributes)
  if (
    event.detail.target.id === MODAL_CONFIG.CONTAINER_ID &&
    event.detail.target.innerHTML.trim() &&
    (event.detail.target.querySelector('.modal-header') ||
      event.detail.target.querySelector('.modal-content') ||
      event.detail.target.querySelector('.modal-footer'))
  ) {
    showModal();
  }
}

/**
 * Handle actions before modal content swap
 * @param {Event} event - HTMX beforeSwap event
 */
export function handleModalBeforeSwap(event) {
  if (event.detail.target.closest('.modal-content')) {
    hideModal();
  }
}

/**
 * Create a modal programmatically
 * @param {Object} options - Modal options
 * @param {string} options.content - Modal content
 * @param {string} [options.title] - Modal title
 * @param {Function} [options.onConfirm] - Confirm callback
 * @param {Function} [options.onCancel] - Cancel callback
 */
export function createModal({ content, title, onConfirm, onCancel }) {
  const container = document.createElement('div');
  container.id = MODAL_CONFIG.CONTAINER_ID;
  container.className = MODAL_CONFIG.MODAL_CLASS;

  container.innerHTML = `
        ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
        <div class="modal-content">${content}</div>
        <div class="modal-actions">
            ${onConfirm ? '<button class="button is-primary" data-action="confirm">Confirm</button>' : ''}
            ${onCancel ? '<button class="button" data-action="cancel">Cancel</button>' : ''}
        </div>
    `;

  // Add event listeners
  if (onConfirm) {
    container.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      onConfirm();
      hideModal();
    });
  }

  if (onCancel) {
    container.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      onCancel();
      hideModal();
    });
  }

  // Replace existing modal or add to body
  const existingModal = document.getElementById(MODAL_CONFIG.CONTAINER_ID);
  if (existingModal) {
    existingModal.replaceWith(container);
  } else {
    document.body.appendChild(container);
  }

  showModal();
}

/**
 * Initialize the modal system
 * Sets up event listeners and creates the modal container if needed
 */
export function initializeModal() {
  // Create modal container if it doesn't exist
  let container = document.getElementById(MODAL_CONFIG.CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = MODAL_CONFIG.CONTAINER_ID;
    container.className = MODAL_CONFIG.MODAL_CLASS;
    document.body.appendChild(container);
  }

  // Set up event delegation for modal close buttons
  document.body.addEventListener('click', (event) => {
    if (event.target.closest('[data-modal-close="true"]')) {
      event.preventDefault();
      hideModal();
    }
  });

  // Set up HTMX event listeners
  document.body.addEventListener('htmx:afterSwap', handleModalContentSwap);
  document.body.addEventListener('htmx:beforeSwap', handleModalBeforeSwap);
}
