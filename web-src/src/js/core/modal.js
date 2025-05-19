/**
 * Modal System
 * @module core/modal
 */

// Modal configuration
const MODAL_CONFIG = {
    CONTAINER_ID: 'modal-container',
    OVERLAY_CLASS: 'modal-overlay',
    MODAL_CLASS: 'modal',
    ACTIVE_CLASS: 'is-active',
    ANIMATION_DURATION: 300,
    Z_INDEX: 1000
};

let activeModal = null;
let previousFocus = null;

/**
 * Show the modal
 */
export function showModal() {
    const container = document.getElementById(MODAL_CONFIG.CONTAINER_ID);
    if (!container) return;

    // Store current focus
    previousFocus = document.activeElement;

    // Create and show overlay
    const overlay = createOverlay();
    document.body.appendChild(overlay);

    // Show modal
    container.classList.add(MODAL_CONFIG.ACTIVE_CLASS);
    activeModal = container;

    // Focus first focusable element
    focusFirstElement();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
}

/**
 * Hide the modal
 */
export function hideModal() {
    if (!activeModal) return;

    // Remove overlay
    const overlay = document.querySelector(`.${MODAL_CONFIG.OVERLAY_CLASS}`);
    if (overlay) {
        overlay.remove();
    }

    // Hide modal
    activeModal.classList.remove(MODAL_CONFIG.ACTIVE_CLASS);

    // Restore focus
    if (previousFocus) {
        previousFocus.focus();
    }

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';

    activeModal = null;
    previousFocus = null;
}

/**
 * Create the modal overlay
 * @returns {HTMLElement} The overlay element
 */
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = MODAL_CONFIG.OVERLAY_CLASS;
    overlay.style.zIndex = MODAL_CONFIG.Z_INDEX - 1;
    overlay.addEventListener('click', hideModal);
    return overlay;
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

    return Array.from(activeModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
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
    if (event.detail.target.id === MODAL_CONFIG.CONTAINER_ID) {
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