# Design System

> **Visual design language and component library for Adobe App Builder Commerce integration**

## Overview

This design system provides a consistent visual language for the Adobe App Builder Commerce integration service. It includes design tokens, components, and patterns that ensure a cohesive and professional user experience.

## Design Principles

### **1. Clarity**

- Clear visual hierarchy through typography and spacing
- Intuitive iconography and visual cues
- Consistent interaction patterns

### **2. Efficiency**

- Fast loading with minimal CSS footprint
- Optimized for Adobe I/O Runtime performance
- Progressive enhancement approach

### **3. Accessibility**

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### **4. Adobe Brand Alignment**

- Consistent with Adobe's design language
- Professional enterprise appearance
- Modern web application aesthetics

## Design Tokens

### **Color System**

#### **Primary Palette**

```css
/* Adobe Brand Colors */
--color-adobe-blue: #1473e6;
--color-adobe-blue-hover: #0d66d0;
--color-adobe-blue-active: #095aba;
--color-adobe-blue-light: #e5f4ff;

/* Commerce Integration Colors */
--color-commerce-primary: #ff6900;
--color-commerce-secondary: #ff8c42;
--color-commerce-light: #fff4f0;
```

#### **Semantic Colors**

```css
/* Success States */
--color-success: #2d9d78;
--color-success-hover: #268e6c;
--color-success-light: #e8f5f2;

/* Warning States */
--color-warning: #e68619;
--color-warning-hover: #cb7714;
--color-warning-light: #fdf4e8;

/* Error States */
--color-error: #e34850;
--color-error-hover: #c9252d;
--color-error-light: #fdf2f2;

/* Info States */
--color-info: #378ef0;
--color-info-hover: #2680eb;
--color-info-light: #f0f8ff;
```

#### **Neutral Palette**

```css
/* Grayscale */
--color-white: #ffffff;
--color-gray-25: #fcfcfc;
--color-gray-50: #fafafa;
--color-gray-100: #f8f8f8;
--color-gray-200: #e8e8e8;
--color-gray-300: #d1d1d1;
--color-gray-400: #bababa;
--color-gray-500: #6e6e6e;
--color-gray-600: #4b4b4b;
--color-gray-700: #2c2c2c;
--color-gray-800: #1a1a1a;
--color-gray-900: #0f0f0f;
```

### **Typography**

#### **Font Stack**

```css
--font-family-primary:
  'Adobe Clean', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-family-mono: 'Adobe Clean Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
```

#### **Type Scale**

```css
/* Font Sizes */
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### **Spacing System**

```css
/* Spacing Scale */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

### **Border & Radius**

```css
/* Border Radius */
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px */
--radius-base: 0.5rem; /* 8px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */
--radius-full: 9999px;

/* Border Widths */
--border-width-1: 1px;
--border-width-2: 2px;
--border-width-4: 4px;
```

### **Shadows & Elevation**

```css
/* Shadow System */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-base: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.15);

/* Elevation Levels */
--elevation-1: var(--shadow-xs);
--elevation-2: var(--shadow-sm);
--elevation-3: var(--shadow-base);
--elevation-4: var(--shadow-lg);
--elevation-5: var(--shadow-xl);
```

### **Animation & Motion**

```css
/* Duration */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 400ms;

/* Easing Functions */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Component Library

### **Buttons**

#### **Primary Button**

```css
.btn {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  text-decoration: none;
  border: var(--border-width-1) solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);

  /* Focus styles */
  &:focus {
    outline: 2px solid var(--color-adobe-blue);
    outline-offset: 2px;
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.btn-primary {
  background-color: var(--color-adobe-blue);
  color: var(--color-white);

  &:hover {
    background-color: var(--color-adobe-blue-hover);
  }

  &:active {
    background-color: var(--color-adobe-blue-active);
  }
}

.btn-secondary {
  background-color: var(--color-white);
  color: var(--color-adobe-blue);
  border-color: var(--color-adobe-blue);

  &:hover {
    background-color: var(--color-adobe-blue-light);
  }
}

.btn-danger {
  background-color: var(--color-error);
  color: var(--color-white);

  &:hover {
    background-color: var(--color-error-hover);
  }
}

/* Button sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-base);
}
```

#### **Button with Loading State**

```html
<button class="btn btn-primary" data-loading="false">
  <span class="btn-text">Export Products</span>
  <span class="btn-loading" style="display: none;">
    <svg class="spinner" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
        stroke-dasharray="32"
        stroke-dashoffset="32"
      >
        <animate
          attributeName="stroke-dasharray"
          dur="1s"
          values="0 32;16 16;0 32"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          dur="1s"
          values="0;-16;-32"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    Loading...
  </span>
</button>
```

### **Data Tables**

#### **Base Table Styles**

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--elevation-1);
  border: var(--border-width-1) solid var(--color-gray-200);
}

.data-table th {
  background: var(--color-gray-50);
  padding: var(--space-4) var(--space-6);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border-bottom: var(--border-width-1) solid var(--color-gray-200);
}

.data-table td {
  padding: var(--space-4) var(--space-6);
  border-bottom: var(--border-width-1) solid var(--color-gray-100);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.data-table tbody tr {
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.data-table tbody tr:hover {
  background-color: var(--color-gray-25);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Action column */
.data-table .actions {
  white-space: nowrap;
  text-align: right;
}

.data-table .actions .btn {
  margin-left: var(--space-2);
}

.data-table .actions .btn:first-child {
  margin-left: 0;
}
```

#### **Loading States**

```css
.data-table.loading {
  opacity: 0.7;
  pointer-events: none;
}

.skeleton-row {
  background: var(--color-gray-100);
  border-radius: var(--radius-sm);
  height: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-row--wide {
  width: 80%;
}

.skeleton-row--medium {
  width: 60%;
}

.skeleton-row--narrow {
  width: 40%;
}
```

### **Forms**

#### **Form Controls**

```css
.form-group {
  margin-bottom: var(--space-6);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.form-control {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width-1) solid var(--color-gray-300);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  background-color: var(--color-white);
  transition: border-color var(--duration-fast) var(--ease-in-out);

  &:focus {
    outline: none;
    border-color: var(--color-adobe-blue);
    box-shadow: 0 0 0 3px var(--color-adobe-blue-light);
  }

  &:disabled {
    background-color: var(--color-gray-50);
    color: var(--color-gray-400);
    cursor: not-allowed;
  }

  &.error {
    border-color: var(--color-error);
  }
}

.form-text {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}
```

#### **Checkbox Groups**

```css
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.checkbox {
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  cursor: pointer;
}

.checkbox input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  margin-right: var(--space-2);
  accent-color: var(--color-adobe-blue);
}
```

### **Modals**

#### **Modal Structure**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.modal-dialog {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-4);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn var(--duration-normal) var(--ease-out);
}

.modal-header {
  padding: var(--space-6);
  border-bottom: var(--border-width-1) solid var(--color-gray-200);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin: 0;
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: var(--border-width-1) solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### **Notifications**

#### **Toast Notifications**

```css
.notification-container {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  z-index: 1100;
  max-width: 400px;
}

.notification {
  background: var(--color-white);
  border-radius: var(--radius-base);
  box-shadow: var(--elevation-3);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  border-left: 4px solid;
  display: flex;
  align-items: flex-start;
  animation: slideInRight var(--duration-normal) var(--ease-out);
}

.notification-success {
  border-left-color: var(--color-success);
}

.notification-error {
  border-left-color: var(--color-error);
}

.notification-warning {
  border-left-color: var(--color-warning);
}

.notification-info {
  border-left-color: var(--color-info);
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin: 0 0 var(--space-1) 0;
}

.notification-message {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin: 0;
}

.notification-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0;
  margin-left: var(--space-3);
  line-height: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### **Loading Indicators**

#### **Spinner Component**

```css
.spinner {
  width: 1rem;
  height: 1rem;
  animation: spin var(--duration-slower) linear infinite;
}

.spinner-lg {
  width: 2rem;
  height: 2rem;
}

.spinner-sm {
  width: 0.75rem;
  height: 0.75rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}
```

## Layout Patterns

### **Application Shell**

```css
.app-shell {
  min-height: 100vh;
  background: var(--color-gray-50);
}

.app-header {
  background: var(--color-white);
  border-bottom: var(--border-width-1) solid var(--color-gray-200);
  padding: var(--space-4) var(--space-6);
}

.app-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin: 0;
}

.app-content {
  padding: var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.content-section {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-1);
  padding: var(--space-8);
  margin-bottom: var(--space-8);
}

.section-header {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-800);
  margin: 0 0 var(--space-2) 0;
}

.section-description {
  font-size: var(--font-size-base);
  color: var(--color-gray-600);
  margin: 0;
}
```

### **Responsive Grid**

```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}
.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## Responsive Design

### **Breakpoints**

```css
/* Mobile first approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Responsive utilities */
@media (max-width: 640px) {
  .app-content {
    padding: var(--space-4);
  }

  .content-section {
    padding: var(--space-6);
  }

  .data-table {
    font-size: var(--font-size-xs);
  }

  .data-table th,
  .data-table td {
    padding: var(--space-3) var(--space-4);
  }
}
```

## Accessibility Features

### **Focus Management**

```css
/* Focus visible for keyboard users */
.focus-visible {
  outline: 2px solid var(--color-adobe-blue);
  outline-offset: 2px;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-adobe-blue);
  color: var(--color-white);
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  border-radius: var(--radius-base);
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

### **Screen Reader Support**

```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-gray-300: #000000;
    --color-gray-600: #000000;
  }

  .btn {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Usage Guidelines

### **Color Usage**

1. **Primary Actions**: Use Adobe blue for main CTAs
2. **Semantic States**: Use semantic colors consistently for success, warning, error states
3. **Neutral Content**: Use grayscale for text and backgrounds
4. **Commerce Branding**: Use commerce orange sparingly for brand elements

### **Typography Hierarchy**

1. **Page Titles**: `font-size-2xl` + `font-weight-semibold`
2. **Section Titles**: `font-size-xl` + `font-weight-semibold`
3. **Component Titles**: `font-size-lg` + `font-weight-medium`
4. **Body Text**: `font-size-base` + `font-weight-normal`
5. **Caption Text**: `font-size-sm` + `color-gray-500`

### **Spacing Consistency**

1. **Component Padding**: Use `space-4` for most components
2. **Section Spacing**: Use `space-8` between major sections
3. **Element Spacing**: Use `space-6` between related elements
4. **Text Spacing**: Use `space-2` for small gaps, `space-4` for medium gaps

### **Interaction States**

1. **Hover**: Subtle color changes with `duration-fast`
2. **Focus**: Clear outline with `color-adobe-blue`
3. **Active**: Darker variant of base color
4. **Disabled**: Reduced opacity (0.6) and no pointer events

## Implementation

### **CSS Custom Properties Setup**

```css
/* Add to your main CSS file */
:root {
  /* Import all design tokens here */
  /* Colors */
  --color-adobe-blue: #1473e6;
  /* Typography */
  --font-family-primary: 'Adobe Clean', system-ui, sans-serif;
  /* Spacing */
  --space-1: 0.25rem;
  /* Etc... */
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --color-white: #1a1a1a;
    --color-gray-50: #2c2c2c;
    --color-gray-800: #f8f8f8;
    /* Adjust other colors for dark mode */
  }
}
```

### **Component Integration with HTMX**

```html
<!-- Example: Data table with design system classes -->
<div class="content-section">
  <div class="section-header">
    <h2 class="section-title">Product Export Files</h2>
    <p class="section-description">Manage your exported product data files</p>
  </div>

  <table
    class="data-table"
    hx-get="/api/v1/web/kukla-integration-service/browse-files"
    hx-trigger="load"
  >
    <thead>
      <tr>
        <th>File Name</th>
        <th>Size</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Server-rendered content with design system classes -->
    </tbody>
  </table>
</div>
```

## Related Documentation

- **[Frontend Development](frontend.md)** - HTMX implementation patterns
- **[HTMX Integration](../architecture/htmx-integration.md)** - Architecture decisions
- **[Coding Standards](coding-standards.md)** - CSS coding guidelines
- **[Adobe App Builder Architecture](../architecture/adobe-app-builder.md)** - Platform constraints

---

_This design system ensures consistent, accessible, and performant user interfaces for Adobe App Builder Commerce integration applications._
