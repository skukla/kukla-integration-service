# Adobe Commerce File Browser Design System

This document outlines the design system used in the Adobe Commerce File Browser application. Our design system is built on a foundation of consistent tokens, components, and patterns that ensure a cohesive user experience.

## Design Tokens

### Colors

#### Grayscale
Our grayscale palette provides a range of neutral colors for backgrounds, text, and borders:

- `--color-white: #FFFFFF` - Pure white, used for card backgrounds
- `--color-gray-25: #FCFCFC` - Subtle off-white
- `--color-gray-50: #FAFAFA` - Light background
- `--color-gray-100: #F8F8F8` - Light gray
- `--color-gray-150: #ECECEC` - Mid-light gray
- `--color-gray-175: #EAEAEA` - Custom mid-gray
- `--color-gray-200: #E8E8E8` - Medium gray
- `--color-gray-300: #D1D1D1` - Border color
- `--color-gray-400: #BABABA` - Disabled text
- `--color-gray-500: #6E6E6E` - Secondary text
- `--color-gray-600: #4B4B4B` - Primary text
- `--color-gray-700: #2C2C2C` - Strong text
- `--color-gray-800: #1A1A1A` - Extra strong text
- `--color-gray-900: #0F0F0F` - Near black

#### Brand Colors
Adobe's brand colors for interactive elements:

- `--color-blue-50: #F5F9FF` - Lightest blue, hover states
- `--color-blue-100: #E5F4FF` - Light blue backgrounds
- `--color-blue-200: #CCE9FF` - Strong hover states
- `--color-blue-primary: #1473E6` - Primary actions
- `--color-blue-hover: #0D66D0` - Hover state
- `--color-blue-active: #095ABA` - Active state

#### Semantic Colors
Colors that convey meaning:

- Success: `#2D9D78` (hover: `#268E6C`, active: `#1F7355`)
- Warning: `#E68619` (hover: `#CB7714`, active: `#A35F10`)
- Danger: `#E34850` (hover: `#C9252D`, active: `#B31B1B`)

### Typography

#### Font Family
```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Adobe Clean', 'Segoe UI', sans-serif
```

#### Font Sizes
- XS: `0.75rem` (12px)
- SM: `0.875rem` (14px)
- MD: `1rem` (16px)
- LG: `1.125rem` (18px)
- XL: `1.25rem` (20px)
- 2XL: `1.5rem` (24px)
- 3XL: `1.875rem` (30px)

#### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing

Our spacing system uses a consistent scale:

- XS: `0.25rem` (4px)
- SM: `0.5rem` (8px)
- MD: `1rem` (16px)
- LG: `1.5rem` (24px)
- XL: `2rem` (32px)
- 2XL: `2.5rem` (40px)
- 3XL: `3rem` (48px)

### Borders & Radius

#### Border Radius
- Small: `4px`
- Medium: `8px`
- Large: `12px`
- Full: `9999px`

#### Border Widths
- XS: `1px`
- SM: `2px`
- MD: `4px`

### Shadows

Three levels of elevation:
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1)
```

### Animation & Timing

#### Durations
- Instant: 100ms
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms
- Slower: 400ms
- Spinner: 800ms
- Notification: 300ms

#### Easing Functions
- Default: `cubic-bezier(0.4, 0, 0.2, 1)`
- In: `cubic-bezier(0.4, 0, 1, 1)`
- Out: `cubic-bezier(0, 0, 0.2, 1)`
- In-Out: `cubic-bezier(0.4, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

## Components

### File Browser

The main component for displaying and managing files:

```css
.file-browser {
    min-height: var(--file-browser-min-height);
    background: var(--file-browser-table-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--file-browser-border);
}
```

#### Grid Layout
Uses a 4-column grid:
- File Name: 30%
- Size: 15%
- Last Modified: 25%
- Actions: 30%

### Notifications

Toast notifications for user feedback:
- Success: Green with checkmark
- Error: Red with warning icon
- Warning: Orange with caution icon
- Info: Blue with info icon

Features:
- Auto-dismiss after timeout
- Slide-in animation
- Stacking support
- Responsive design

### Loading States

#### Skeleton Loading
- Animated pulse effect
- Maintains layout structure
- Prevents content shift
- Custom widths for different content types

## Usage Guidelines

### Layout Structure

1. App Header
   - Main title
   - Navigation (if needed)

2. Content Section
   - Section header with title and description
   - Main content area
   - White background
   - Rounded corners
   - Shadow for elevation

3. File Browser
   - Table header with column titles
   - Rows with hover states
   - Action buttons aligned right
   - Loading states for async operations

### Responsive Design

Breakpoints:
- SM: 640px
- MD: 768px
- LG: 1024px
- XL: 1280px

Mobile Adaptations:
- Stacked layout for table rows
- Adjusted padding and margins
- Full-width notifications
- Simplified actions menu

### Best Practices

1. Color Usage
   - Use semantic colors for user feedback
   - Maintain sufficient contrast ratios
   - Use brand colors sparingly for emphasis

2. Typography
   - Use size scale appropriately for hierarchy
   - Maintain consistent line heights
   - Consider mobile readability

3. Spacing
   - Use consistent spacing tokens
   - Maintain vertical rhythm
   - Adjust spacing responsively

4. Interactions
   - Provide hover and focus states
   - Use appropriate animation timing
   - Ensure keyboard accessibility

## Accessibility

- High contrast mode support
- Keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader support
- Reduced motion preferences 