# Internal Debugging Process

[← Back to Debugging Guide](debugging.md)

## Overview

This document outlines our internal team's structured approach to debugging, testing, and fixing issues while maintaining alignment with our architectural simplification principles. This is a companion to the [Debugging Guide](debugging.md), which focuses on practical debugging workflows and tools.

This process document is specifically for team members to ensure:

- Consistent quality standards
- Architectural alignment
- Documentation maintenance
- Process compliance

For practical debugging workflows and tools, please refer to the [Debugging Guide](debugging.md).

## Pre-Fix Process

### 1. Issue Discovery

- Document initial issue in `debugging-log.md`
- Capture exact error messages and stack traces
- Note which phase of simplification the affected component belongs to
- Reference relevant simplification principles that must be maintained

### 2. Impact Analysis

- Check against architectural boundaries defined in Phase 4
- Verify if issue crosses multiple domains (frontend/backend/core)
- Identify potential impact on other simplified components
- Document dependencies involved

### 3. Debug Information Gathering

```bash
# Standard debug info to collect
1. Browser Console Logs
2. Network Requests (if applicable)
3. Server-side Logs
4. State at time of error
5. Steps to reproduce
```

## Fix Implementation

### 1. Pre-Implementation Checklist

- [ ] Verify fix aligns with simplified architecture
- [ ] Check if fix maintains flat module organization (Phase 4)
- [ ] Ensure fix uses standardized error handling (Phase 5)
- [ ] Confirm fix follows URL/HTTP consolidation (Phase 1)
- [ ] Validate against file operations standards (Phase 2)
- [ ] Check HTMX integration compliance (Phase 3)

### 2. Implementation Guidelines

- Keep changes minimal and focused
- Use established patterns from simplification phases
- Follow domain-driven organization
- Maintain clear separation of concerns
- Use standardized utilities from core modules

### 3. Code Location Guidelines

```tree
Frontend Changes:
web-src/src/js/
├── htmx/      # HTMX-related fixes
├── core/      # Core functionality fixes
└── browser/   # Browser component fixes

Backend Changes:
actions/
├── core/      # Utility fixes
├── commerce/  # Commerce integration fixes
├── htmx/      # HTMX response fixes
└── frontend/  # Frontend handler fixes
```

## Documentation Alignment Verification

### 1. Documentation Review

Before marking any fix as complete, review:

- `architecture.md` for component placement and patterns
- `htmx.md` for frontend integration patterns
- Component-specific documentation (e.g., `file-operations.md`, `error-handling.md`)
- Design system requirements in `design-system.md`

### 2. Architecture Alignment Check

For each fix, verify against the implemented architecture:

```tree
Backend Structure:              Frontend Structure:
actions/                       web-src/src/js/
├── core/                     ├── core/
│   ├── http.js              │   ├── http.js
│   ├── files.js             │   ├── urls.js
│   └── validation.js        │   └── modal.js
├── commerce/                 ├── htmx/
├── htmx/                    │   ├── config.js
└── frontend/                │   └── events.js
    └── browse-files/        └── browser/
```

### 3. Pattern Compliance Matrix

Document each fix's compliance:

```markdown
Fix: [Description]
| Component     | Expected Pattern             | Implementation              | Status |
|--------------|-----------------------------|-----------------------------|--------|
| Location     | [Path from architecture.md] | [Actual implementation]     | ✓/✗    |
| Integration  | [Pattern from docs]         | [How pattern was followed]  | ✓/✗    |
| Dependencies | [Expected dependencies]     | [Actual dependencies]       | ✓/✗    |
```

### 4. Fix Documentation Update

After verification, update `debugging-log.md` with:

- Architecture alignment status
- Pattern compliance details
- Any deviations and their justification
- Recommendations for future alignment

## Testing Process

### 1. Individual Component Testing

- Test in isolation following domain boundaries
- Verify fix doesn't break simplified architecture
- Check against relevant simplification phase requirements

### 2. Integration Testing

- Test interaction with dependent components
- Verify simplified module organization maintained
- Check error handling patterns
- Validate URL and HTTP handling

### 3. Performance Testing

- Monitor bundle size impact
- Check response times
- Verify resource usage
- Compare against pre-simplification metrics

## Documentation

### 1. Fix Documentation

Update `debugging-log.md` with:

- Complete fix description
- Simplification principles maintained
- Testing verification results
- Performance impact
- **Architecture Alignment Results**
    - Component placement verification
    - Pattern compliance details
    - Documentation references

### 2. Architectural Documentation

- Update relevant simplification phase docs if needed
- Document any new patterns or solutions
- Update component documentation

## Deployment

### 1. Pre-deployment Checklist

- [ ] All simplification principles maintained
- [ ] No regression in simplified architecture
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Performance metrics acceptable
- [ ] **Architecture alignment verified**
- [ ] **Pattern compliance documented**
- [ ] **Documentation references updated**

### 2. Deployment Steps

1. Backup current state
2. Apply fixes in correct dependency order
3. Verify all systems operational
4. Monitor for any regressions

### 3. Post-deployment Verification

- Verify fix in production environment
- Monitor error rates
- Check performance metrics
- Validate user experience

## Quality Gates

### 1. Code Quality

- Maintains simplified architecture
- Follows established patterns
- Uses standardized utilities
- Clear and maintainable
- **Verified against architecture docs**
- **Pattern compliance confirmed**
- **Documentation alignment checked**

### 2. Testing Quality

- Comprehensive test coverage
- Integration tests passing
- Performance requirements met
- No regressions

### 3. Documentation Quality

- Clear problem description
- Detailed solution explanation
- Updated architectural docs
- Maintained simplification docs
- **Architecture alignment documented**
- **Pattern compliance matrix completed**
- **Documentation cross-references verified**

## Fix Review Process

### 1. Simplification Phase Alignment

For each fix, validate against relevant simplification phases:

#### Phase 1: URL and HTTP Handling

- [ ] Uses consolidated HTTP utilities from `actions/shared/http/`
- [ ] No direct URL construction in components
- [ ] Frontend uses `action-urls.js`
- [ ] Backend uses shared HTTP utilities

#### Phase 2: File Operations

- [ ] Uses operations from `actions/shared/file/`
- [ ] Implements standard error handling
- [ ] Follows metadata handling patterns
- [ ] Maintains security checks

#### Phase 3: HTMX Integration

- [ ] Configuration centralized in `htmx.js`
- [ ] Event handling through `htmx-events.js`
- [ ] Uses standard modal system
- [ ] Follows response patterns

#### Phase 4: Module Organization

- [ ] Maintains flat directory structure
- [ ] Follows domain-driven organization:

  ```tree
  Frontend:                    Backend:
  web-src/src/js/             actions/
  ├── htmx/                   ├── core/
  ├── core/                   ├── commerce/
  └── browser/                ├── htmx/
                             └── frontend/
  ```

- [ ] No circular dependencies
- [ ] Clear separation of concerns

#### Phase 5: Error Handling

- [ ] Uses standard error types
- [ ] Implements proper user feedback
- [ ] Maintains debugging capability
- [ ] Follows error patterns

### 2. Fix Impact Analysis

For each fix, document:

```markdown
#### Fix Impact: [Fix Description]
- **Modified Components**:
  - List of changed files/components
- **Simplification Alignment**:
  - Phase 1: [Impact/Changes]
  - Phase 2: [Impact/Changes]
  - Phase 3: [Impact/Changes]
  - Phase 4: [Impact/Changes]
  - Phase 5: [Impact/Changes]
- **Architecture Impact**:
  - Any changes to core patterns
  - Effects on other components
- **Recommendations**:
  - Suggested improvements
  - Areas to monitor
```

### 3. Review Checklist

Before marking any fix as complete:

- [ ] All affected simplification phases reviewed
- [ ] No violations of architectural principles
- [ ] Documentation updated
- [ ] Tests cover the changes
- [ ] Performance impact assessed
- [ ] Security implications considered

### 4. Documentation Updates

After each fix:

1. Update `debugging-log.md` with simplification compliance
2. Document any new patterns or solutions
3. Update relevant architectural documentation
4. Add any necessary migration notes

### 5. Monitoring Points

Establish monitoring for:

- Performance metrics
- Error rates
- User feedback
- System stability
- Resource usage
