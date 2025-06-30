# API Mesh Performance Optimization

## Overview

This document tracks the performance optimization efforts for the `get-products-mesh` action, comparing it against the REST API baseline and documenting optimization strategies.

## Performance Baseline (Initial)

**Test Date**: June 29, 2025  
**Environment**: Staging  

| Method | Duration | Products | Performance Gap |
|--------|----------|----------|-----------------|
| REST API | 2,903ms | 119 | Baseline |
| API Mesh | 12,844ms | 119 | **+285.2% slower** |

### Key Findings

✅ **Data Parity Confirmed**: Both methods process exactly 119 products  
✅ **Functional Parity**: Both generate CSV files successfully (17KB vs 18KB)  
⚠️ **Performance Issue**: API Mesh is nearly 3x slower than REST API  

## Optimization Phase 1: Batch Size Tuning

**Approach**: Test different `pageSize` values in the mesh resolver GraphQL query.

### Batch Size Test Results

| Batch Size | Duration | vs REST API | vs Initial Mesh |
|------------|----------|-------------|------------------|
| 50 | 10,984ms | +278.4% | **+16.9% slower** |
| 100 | 7,283ms | +150.9% | **+43.3% faster** |
| 150 | 7,800ms | +168.7% | +39.3% faster |
| 200 | 7,329ms | +152.5% | +43.0% faster |
| **300** | **7,276ms** | **+150.6%** | **+43.4% faster** |

### Key Insights

🏆 **Optimal Batch Size**: 300 products per page  
📈 **Performance Improvement**: 43.4% faster than initial mesh configuration  
📉 **Still Slower**: 150.6% slower than REST API, requiring further optimization  

### Configuration Changes Applied

Updated both staging and production configurations:

```javascript
mesh: {
  pagination: {
    defaultPageSize: 300, // Optimized based on performance testing
    maxPages: 25,
  },
  batching: {
    categories: 20,
    inventory: 50,
  },
}
```

## Tools Created

### Performance Testing Scripts

- **`npm run test:mesh:perf`** - Quick REST vs Mesh comparison
- **`npm run test:mesh:batch`** - Batch size optimization testing

### Script Features

- Automated performance measurement
- Real-time comparison analysis
- Data parity verification
- Optimization recommendations

## Next Phase: Additional Optimizations

### Phase 2 Candidates (Estimated Impact)

1. **Concurrency Optimization** (Medium Impact)
   - Adjust `maxConcurrent` Commerce API calls
   - Fine-tune `requestDelay` settings
   - Test parallel category/inventory fetching

2. **Caching Strategy** (High Impact)
   - Implement category caching in mesh resolver
   - Cache product attribute mappings
   - Reduce redundant API calls

3. **Architecture Analysis** (High Impact)
   - Profile GraphQL processing overhead
   - Analyze network latency between mesh and Commerce
   - Consider data transformation optimization

4. **Memory Optimization** (Low Impact)
   - Streamline product enrichment logic
   - Optimize object creation patterns
   - Reduce memory allocation overhead

### Success Criteria

- **Target**: Get mesh performance within 20% of REST API (3,500ms or less)
- **Minimum**: Achieve at least 50% improvement over initial baseline (6,400ms or less)

## Technical Debt Notes

- Broken performance framework in `src/core/testing/performance/` marked for removal
- Current working solution: focused scripts in `scripts/` directory
- Future framework should follow project patterns and minimal dependencies

---

**Last Updated**: June 29, 2025  
**Branch**: `feature/mesh-performance-optimization`  
**Status**: Phase 1 complete, Phase 2 planning
