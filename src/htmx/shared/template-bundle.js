/**
 * HTMX Template Bundle (Generated)
 * All EJS templates embedded as strings for Adobe I/O Runtime deployment
 * 
 * ⚠️  This file is auto-generated. Do not edit manually.
 * ⚠️  Run 'npm run build:templates' to regenerate.
 */

// Embedded templates
const TEMPLATES = {
  'delete-modal': `<div class="modal-overlay" id="delete-modal">
  <div class="modal">
    <div class="modal-header">
      <h3>Confirm File Deletion</h3>
      <button class="modal-close" onclick="cancelDelete()" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete this file? This action cannot be undone.</p>
      <% if (isProtected) { %>
      <div class="modal-warning">⚠️ This file may be protected. Deletion may not be allowed.</div>
      <% } %>
      <div class="file-info">
        <div class="file-info-row">
          <strong>Name:</strong> <span class="file-name"><%= fileName %></span>
        </div>
        <div class="file-info-row">
          <strong>Size:</strong> <span class="file-size"><%= fileSize %></span>
        </div>
        <div class="file-info-row">
          <strong>Modified:</strong> <span class="file-date"><%= fileDate %></span>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="cancelDelete()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmDelete('<%= fileName %>')"
              <% if (isProtected) { %>title="File may be protected"<% } %>>
        Delete File
      </button>
    </div>
  </div>
</div> `,
  'empty-file-list': `<div class="empty-state">
  <div class="empty-icon">📄</div>
  <h2>No exported files found</h2>
  <p>Use the export buttons above to create CSV files.</p>
  <p class="empty-details">Files will be stored in <%= storageType %> and appear here.</p>
</div>
`,
  'error-message': `<div class="error-message htmx-error">
  <div class="error-icon">⚠️</div>
  <div class="error-content">
    <h4><%= title || 'Error' %></h4>
    <p><%= message %></p>
    <% if (details) { %>
    <p class="error-details"><%= details %></p>
    <% } %>
  </div>
</div> `,
  'error-modal': `<div class="modal-overlay" id="error-modal">
  <div class="modal modal-error">
    <div class="modal-header">
      <h3>❌ Error</h3>
      <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <p><%= message %></p>
      <% if (details) { %>
      <p class="error-details"><%= details %></p>
      <% } %>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal()">OK</button>
    </div>
  </div>
</div> `,
  'file-row': `<div class="table-row">
  <div class="table-cell">
    <span class="file-name"><%= fileName %></span>
  </div>
  <div class="table-cell">
    <span class="file-size"><%= fileSize %></span>
  </div>
  <div class="table-cell">
    <span class="file-date"><%= fileDate %></span>
  </div>
  <div class="table-cell">
    <div class="table-actions">
      <a
        href="<%= downloadUrl %>"
        class="btn btn-sm btn-primary"
        download="<%= fileName %>"
        title="Download <%= fileName %>"
      >
        Download
      </a>
      <button
        class="btn btn-sm btn-danger btn-outline"
        data-action="delete"
        data-file-name="<%= fileName %>"
        data-file-path="<%= fullPath %>"
        title="Delete <%= fileName %>"
      >
        Delete
      </button>
    </div>
  </div>
</div>
`,
  'info-modal': `<div class="modal-overlay" id="info-modal">
  <div class="modal modal-<%= type %>">
    <div class="modal-header">
      <h3><%= icon %> <%= title %></h3>
      <% if (showCloseButton) { %>
      <button class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
      <% } %>
    </div>
    <div class="modal-body">
      <p><%= message %></p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary" onclick="closeModal()">OK</button>
    </div>
  </div>
</div> `,
  'notification': `<div class="notification notification-<%= type %>" 
     id="<%= notificationId %>" 
     <% if (autoHide) { %>data-auto-hide="<%= duration %>"<% } %>
     role="alert"
     aria-live="polite">
  <div class="notification-content">
    <div class="notification-icon"><%= icon %></div>
    <div class="notification-message">
      <div class="notification-text"><%= message %></div>
      <% if (details) { %>
      <div class="notification-details"><%= details %></div>
      <% } %>
      <% if (actions && actions.length > 0) { %>
      <div class="notification-actions">
        <% actions.forEach(action => { %>
        <button class="btn btn-sm btn-outline" onclick="<%= action.onClick %>"><%= action.label %></button>
        <% }); %>
      </div>
      <% } %>
    </div>
    <% if (showCloseButton) { %>
    <button class="notification-close" 
            onclick="closeNotification('<%= notificationId %>')"
            aria-label="Close notification">
      &times;
    </button>
    <% } %>
  </div>
</div> `,
  'progress-notification': `<div class="notification notification-progress" 
     id="{{notificationId}}" 
     {{#if autoHide}}data-auto-hide="{{duration}}"{{/if}}
     role="status"
     aria-live="polite">
  <div class="notification-content">
    <div class="notification-icon">🔄</div>
    <div class="notification-message">
      <div class="notification-text">{{message}}</div>
      {{#if showProgress}}
      <div class="progress-bar{{#if indeterminate}} progress-indeterminate{{/if}}">
        <div class="progress-fill"{{#if progress}} style="width: {{progress}}%"{{/if}}></div>
        {{#if progress}}<div class="progress-text">{{progress}}%</div>{{/if}}
      </div>
      {{/if}}
      {{#if actions}}
      <div class="notification-actions">
        {{#each actions}}
        <button class="btn btn-sm btn-outline" onclick="{{onClick}}">{{label}}</button>
        {{/each}}
      </div>
      {{/if}}
    </div>
    {{#if showCloseButton}}
    <button class="notification-close" 
            onclick="closeNotification('{{notificationId}}')"
            aria-label="Close notification">
      &times;
    </button>
    {{/if}}
  </div>
</div> `
};

/**
 * Get template content by name
 * @param {string} templateName - Name of template without .ejs extension
 * @returns {string} Template content as string
 * @throws {Error} If template not found
 */
function getTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) {
    const availableTemplates = Object.keys(TEMPLATES).join(', ');
    throw new Error(`Template '${templateName}' not found. Available: ${availableTemplates}`);
  }
  return template;
}

/**
 * Check if template exists in bundle
 * @param {string} templateName - Name of template to check
 * @returns {boolean} Whether template exists
 */
function hasTemplate(templateName) {
  return templateName in TEMPLATES;
}

/**
 * Get all available template names
 * @returns {Array} Array of template names
 */
function getAvailableTemplates() {
  return Object.keys(TEMPLATES);
}

module.exports = {
  getTemplate,
  hasTemplate,
  getAvailableTemplates,
  TEMPLATES, // Export raw templates for debugging
};
