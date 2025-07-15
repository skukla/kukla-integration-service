# Adobe App Builder - Kukla Integration Service Documentation

> **Adobe Commerce integration service built on Adobe App Builder platform**

## 📚 Documentation Structure

```text
docs/
├── README.md                    # This file - navigation hub
├── getting-started/
│   ├── overview.md             # Project overview and architecture
│   ├── setup.md                # Development environment setup
│
├── development/
│   ├── coding-standards.md     # Code quality and standards
│   ├── testing.md              # Testing strategies and npm scripts
│   ├── frontend.md             # Practical HTMX development patterns
│   ├── design-system.md        # Visual design language and components
│   ├── api-mesh-integration.md # API Mesh with JsonSchema sources pattern
│   ├── configuration.md        # Configuration system and patterns
│   └── schemas.md              # Schema validation system
├── architecture/
│   ├── adobe-app-builder.md    # App Builder platform guide
│   ├── htmx-integration.md     # HTMX frontend patterns
│   ├── true-mesh-pattern.md    # JsonSchema sources architecture pattern
│   ├── project-structure.md    # Comprehensive project file structure
│   └── commerce-integration.md # Adobe Commerce API integration
└── deployment/
    ├── environments.md         # Staging and production deployment
    └── configuration.md        # Environment configuration (legacy reference)
```

## 🚀 Quick Start

### New to the Project?

1. **[Project Overview](getting-started/overview.md)** - Understand what this service does
2. **[Development Setup](getting-started/setup.md)** - Get your environment ready
3. **[Deployment Guide](deployment/environments.md)** - Deploy your first changes

### Developer Resources

- **[Coding Standards](development/coding-standards.md)** - ES6+, async/await, JSDoc patterns
- **[Testing Guide](development/testing.md)** - Using `npm run test:action` and performance testing
- **[Frontend Development](development/frontend.md)** - Practical HTMX development patterns
- **[Design System](development/design-system.md)** - Visual design language and component library
- **[Configuration Guide](development/configuration.md)** - Configuration system and patterns

### Architecture Deep Dives

- **[Adobe App Builder](architecture/adobe-app-builder.md)** - Platform overview and serverless patterns
- **[HTMX Integration](architecture/htmx-integration.md)** - Progressive enhancement and UI patterns
- **[JsonSchema Sources Pattern](architecture/true-mesh-pattern.md)** - API Mesh integration architecture
- **[Commerce Integration](architecture/commerce-integration.md)** - API integration and data flow

### Integration Patterns

- **[API Mesh Integration](development/api-mesh-integration.md)** - JsonSchema sources pattern for GraphQL consolidation
- **[Schema Validation](development/schemas.md)** - Build-time validation and quality assurance

## 🎯 Common Tasks

| Task                  | Documentation                                                        | Key Files                               |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Understand structure  | [Project Structure](architecture/project-structure.md)              | All directories and files               |
| Add new action        | [Adobe App Builder Guide](architecture/adobe-app-builder.md)        | `actions/`, `actions/` |
| Update UI             | [Frontend Development](development/frontend.md)                      | `web-src/`, `src/htmx/`                 |
| Style components      | [Design System](development/design-system.md)                        | `web-src/src/css/`                      |
| Commerce API work     | [Commerce Integration](architecture/commerce-integration.md)         | `src/commerce/`                         |
| API Mesh integration  | [API Mesh Integration](development/api-mesh-integration.md)          | `mesh.config.js`, `mesh.json`          |
| JsonSchema sources    | [JsonSchema Sources Pattern](architecture/true-mesh-pattern.md)     | `mesh.config.js`, `src/mesh/schema/` |
| Configuration setup   | [Configuration Guide](development/configuration.md)                 | `config/`, `.env`, `app.config.yaml`   |
| Deploy changes        | [Deployment Guide](deployment/environments.md)                       | `npm run deploy`, `npm run deploy:prod` |
| Test actions          | [Testing Guide](development/testing.md)                              | `npm run test:action`                   |

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
