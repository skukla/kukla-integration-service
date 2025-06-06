# Adobe App Builder - Kukla Integration Service Documentation

> **Adobe Commerce integration service built on Adobe App Builder platform**

## 📚 Documentation Structure

```
docs/
├── README.md                    # This file - navigation hub
├── getting-started/
│   ├── overview.md             # Project overview and architecture
│   ├── setup.md                # Development environment setup
│
├── development/
│   ├── coding-standards.md     # Code quality and standards
│   ├── testing.md              # Testing strategies and npm scripts
│   ├── frontend.md             # HTMX frontend development patterns
│   └── design-system.md        # Visual design language and components
├── architecture/
│   ├── adobe-app-builder.md    # App Builder platform guide
│   ├── htmx-integration.md     # HTMX frontend patterns
│   └── commerce-integration.md # Adobe Commerce API integration
└── deployment/
    ├── environments.md         # Staging and production deployment
    └── configuration.md        # Environment configuration
```

## 🚀 Quick Start

### New to the Project?

1. **[Project Overview](getting-started/overview.md)** - Understand what this service does
2. **[Development Setup](getting-started/setup.md)** - Get your environment ready
3. **[Deployment Guide](deployment/environments.md)** - Deploy your first changes

### Developer Resources

- **[Coding Standards](development/coding-standards.md)** - ES6+, async/await, JSDoc patterns
- **[Testing Guide](development/testing.md)** - Using `npm run test:action` and performance testing
- **[Frontend Development](development/frontend.md)** - HTMX patterns and JavaScript enhancement
- **[Design System](development/design-system.md)** - Visual design language and component library

### Architecture Deep Dives

- **[Adobe App Builder](architecture/adobe-app-builder.md)** - Platform overview and serverless patterns
- **[HTMX Integration](architecture/htmx-integration.md)** - Progressive enhancement and UI patterns
- **[Commerce Integration](architecture/commerce-integration.md)** - API integration and data flow

## 🎯 Common Tasks

| Task              | Documentation                                                | Key Files                               |
| ----------------- | ------------------------------------------------------------ | --------------------------------------- |
| Add new action    | [Adobe App Builder Guide](architecture/adobe-app-builder.md) | `actions/backend/`, `actions/frontend/` |
| Update UI         | [Frontend Development](development/frontend.md)              | `web-src/`, `src/htmx/`                 |
| Style components  | [Design System](development/design-system.md)                | `web-src/src/css/`                      |
| Commerce API work | [Commerce Integration](architecture/commerce-integration.md) | `src/commerce/`                         |
| Deploy changes    | [Deployment Guide](deployment/environments.md)               | `npm start`, `npm run deploy`           |
| Test actions      | [Testing Guide](development/testing.md)                      | `npm run test:action`                   |

## 📖 Documentation Conventions

### Writing Style

- **Concise and actionable** - Get developers productive quickly
- **Code examples included** - Show, don't just tell
- **Links to actual files** - Reference the real codebase
- **Updated regularly** - Keep docs in sync with code changes

### File Organization

- **Feature-focused** - Group by what developers need to accomplish
- **Progressive depth** - Start simple, provide deeper detail when needed
- **Cross-referenced** - Easy navigation between related topics
- **Version-aware** - Clear about Adobe App Builder and dependency versions

## 🔄 Keeping Documentation Current

When making code changes:

1. **Update relevant documentation** in the same PR
2. **Test examples and links** to ensure accuracy
3. **Add new patterns** to coding standards if introducing them
4. **Update architecture docs** for significant changes

## 🆘 Need Help?

1. **Can't find what you're looking for?** Check the [Project Overview](getting-started/overview.md)
2. **Setup issues?** Follow the [Development Setup](getting-started/setup.md) guide
3. **Deployment problems?** See [Deployment Guide](deployment/environments.md)
4. **Code questions?** Reference [Coding Standards](development/coding-standards.md)

---

_This documentation covers Adobe App Builder Commerce integration service. For Adobe App Builder platform documentation, see [Adobe's official docs](https://developer.adobe.com/app-builder/docs/)._
