# Technical Debt Tracking

## Performance Testing Framework (High Priority)

**Status**: Broken - Multiple dependency issues  
**Created**: During mesh performance optimization work  
**Branch**: feature/mesh-performance-optimization  

### Issue

The existing performance testing framework in `src/core/testing/performance/` has several issues:

- Missing dependencies (`lazy-loader`, incorrect import paths)
- Complex architecture that's difficult to maintain
- Doesn't integrate well with the current project structure

### Current Workaround

Created `scripts/test-mesh-performance.js` - a focused, working solution for mesh performance comparison.

### Recommended Action

After completing mesh performance optimization:

1. **Remove broken framework**: Delete `src/core/testing/performance/` directory
2. **Keep working script**: Maintain `scripts/test-mesh-performance.js`
3. **Update npm scripts**: Remove broken `test:perf` scripts, keep `test:mesh:perf`
4. **Documentation**: Update any references to the old framework

### Estimated Effort

2-3 hours of cleanup work

---

## Future Considerations

If we need a comprehensive performance framework later, start fresh with:

- Simple, focused scripts like `test-mesh-performance.js`
- Direct integration with existing project patterns
- Minimal dependencies and clear interfaces
