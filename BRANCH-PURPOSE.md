# Branch Purposes and Workflow

## Branch Responsibilities

### docs/current
- Source of truth for ALL documentation
- All documentation changes should be made here first
- Other branches should pull documentation updates from this branch

### feature/get-products-clean
- Product-related features and implementation
- Focuses on the get-products endpoint functionality
- Documentation changes should be pulled from docs/current

### feature/local-dev-setup
- Development infrastructure and setup
- Local development environment configuration
- Testing infrastructure
- Documentation changes should be pulled from docs/current

## Documentation Workflow

1. Make ALL documentation changes in `docs/current` first
2. After documentation is updated and committed in `docs/current`:
   ```bash
   # From feature branches, pull docs updates:
   git checkout feature/get-products-clean  # or feature/local-dev-setup
   git checkout docs/current -- docs/
   git commit -m "docs: sync documentation from docs/current"
   ```

## Implementation Workflow

1. Product Features:
   - Make changes in `feature/get-products-clean`
   - Focus on product-related functionality
   - Keep documentation in sync with docs/current

2. Development Infrastructure:
   - Make changes in `feature/local-dev-setup`
   - Focus on development and testing setup
   - Keep documentation in sync with docs/current 