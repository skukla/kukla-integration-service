# Adobe Commerce Integration Service Architecture

This document outlines the reference architecture for the Adobe Commerce Integration Service, designed to support multiple export formats while maintaining clean separation of concerns.

## Directory Structure

```
actions/
├── shared/                         
│   ├── lib/                      
│   │   ├── api/                   # Commerce API functionality
│   │   ├── storage/               # File storage handling
│   │   └── utils.js              # Common utilities
│   └── steps/                    
│       ├── validateInput.js       # Common input validation
│       ├── fetchProducts.js       # Generic product fetching
│       └── storeCsv.js           # Common storage logic
│
├── export-target-feed/            # Creates Target-consumable CSV           
│   ├── config/               
│   │   ├── fields.js             # What we need from Commerce
│   │   └── csv-schema.js         # How Target needs the CSV structured
│   └── index.js                  # Main action (Target-specific file location)
│
├── export-aem-feed/              # Creates AEM-consumable CSV
    ├── config/              
    │   ├── fields.js             # What we need from Commerce
    │   └── csv-schema.js         # How AEM needs the CSV structured
    └── index.js                  # Main action (AEM-specific file location)
```

## Architectural Principles

### 1. Shared Components
- Located in `actions/shared/`
- Contains reusable functionality across all integrations
- Includes common API interactions, storage handling, and utilities
- Provides standardized steps for common operations

### 2. Integration-Specific Actions
- Each integration (Target, AEM) has its own directory
- Contains only integration-specific logic
- Maintains its own configuration
- No shared transformation logic between integrations

### 3. Configuration Management
- Each integration defines what it needs (`fields.js`)
- Each integration specifies its output format (`csv-schema.js`)
- Clear separation between data requirements and output format

### 4. Clean Separation of Concerns
- No inheritance hierarchies
- No shared transformers
- Each integration is independent
- Common functionality through composition, not inheritance

## Benefits

1. **Extensibility**
   - Easy to add new export formats
   - New integrations can be added without affecting existing ones

2. **Maintainability**
   - Clear separation between common and specific logic
   - Each integration's requirements are clearly documented
   - Reduced code duplication

3. **Clarity**
   - Easy to understand what each integration needs
   - Clear where to find specific functionality
   - Well-defined boundaries between components

## Adding New Integrations

To add a new integration:

1. Create a new directory under `actions/`
2. Define configuration in `config/`
   - `fields.js`: What data is needed from Commerce
   - `csv-schema.js`: How the output should be structured
3. Create `index.js` with integration-specific logic
4. Use shared components from `actions/shared/`

## Best Practices

1. Keep integration-specific logic in integration directories
2. Use shared components for common operations
3. Document configuration requirements clearly
4. Maintain clean separation between data fetching and transformation
5. Follow the established pattern for new integrations 