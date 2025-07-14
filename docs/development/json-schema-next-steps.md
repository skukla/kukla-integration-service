# JSON Schema Multi-Source: Next Steps

## Overview

This document provides immediate next steps to begin implementing the JSON Schema multi-source architecture. Follow these steps to start the migration from the current monolithic resolver to a transparent, maintainable multi-source setup.

## Prerequisites Check

Before starting, verify your current working setup:

```bash
# Verify current mesh is working
npm run test:action get-products-mesh

# Check current product processing capability
npm run test:perf:mesh

# Verify OAuth authentication is working
# Should show 119 products processed successfully
```

**Expected Results:**
- ✅ 119 products processed
- ✅ 23.99 KB CSV generated
- ✅ OAuth authentication working
- ✅ No errors in processing

## Immediate Next Steps (Week 1)

### Step 1: Review Documentation
**Time: 30 minutes**

1. **Read the architecture documentation**:
   ```bash
   cat docs/development/json-schema-multi-source-approach.md
   ```

2. **Review the implementation plan**:
   ```bash
   cat docs/development/json-schema-implementation-plan.md
   ```

3. **Understand the current state** by examining the existing resolver:
   ```bash
   wc -l mesh-resolvers.js  # Check current resolver size
   ```

### Step 2: Create Sample Data Directory
**Time: 10 minutes**

```bash
# Create directory structure for JSON schema samples
mkdir -p samples/json-schemas
mkdir -p resolvers
mkdir -p scripts
```

### Step 3: Extract API Samples (Day 1 Implementation)
**Time: 1-2 hours**

1. **Create the sample extraction script**:
   ```bash
   touch scripts/extract-api-samples.js
   ```

2. **Implement the extraction script** (copy from implementation plan):
   ```javascript
   // scripts/extract-api-samples.js
   const fs = require('fs');
   const { makeCommerceRequest } = require('../src/commerce/api/integration');

   async function extractSamples() {
     console.log('🔍 Extracting API samples for JSON Schema...');
     
     try {
       // Extract product sample
       console.log('📦 Fetching products sample...');
       const productsResponse = await makeCommerceRequest('/products', { 
         method: 'GET',
         searchCriteria: { pageSize: 5 } // Small sample for schema generation
       });
       fs.writeFileSync(
         'samples/json-schemas/products-response.json', 
         JSON.stringify(productsResponse, null, 2)
       );

       // Extract category sample  
       console.log('📂 Fetching category sample...');
       const categoryResponse = await makeCommerceRequest('/categories/2', { 
         method: 'GET' 
       });
       fs.writeFileSync(
         'samples/json-schemas/categories-response.json',
         JSON.stringify(categoryResponse, null, 2)
       );

       // Extract inventory sample
       console.log('📊 Fetching inventory sample...');
       const inventoryResponse = await makeCommerceRequest('/inventory/source-items', { 
         method: 'GET',
         searchCriteria: { pageSize: 5 }
       });
       fs.writeFileSync(
         'samples/json-schemas/inventory-response.json',
         JSON.stringify(inventoryResponse, null, 2)
       );

       console.log('✅ Sample extraction complete!');
       console.log('Files created:');
       console.log('  - samples/json-schemas/products-response.json');
       console.log('  - samples/json-schemas/categories-response.json');
       console.log('  - samples/json-schemas/inventory-response.json');
       
     } catch (error) {
       console.error('❌ Sample extraction failed:', error);
       process.exit(1);
     }
   }

   extractSamples();
   ```

3. **Run the extraction script**:
   ```bash
   node scripts/extract-api-samples.js
   ```

4. **Verify samples were created**:
   ```bash
   ls -la samples/json-schemas/
   # Should show three JSON files with sample API responses
   ```

### Step 4: Create Initial JSON Schema Configuration
**Time: 1-2 hours**

1. **Create the new mesh configuration file**:
   ```bash
   touch mesh-json-schema.json
   ```

2. **Implement the basic configuration** (start with Products source):
   ```json
   {
     "meshConfig": {
       "sources": [
         {
           "name": "CommerceProducts",
           "handler": {
             "jsonSchema": {
               "endpoint": "{{{COMMERCE_BASE_URL}}}/rest/V1/",
               "operationHeaders": {
                 "Authorization": "OAuth {context.headers.oauth-signature}",
                 "Accept": "application/json",
                 "Content-Type": "application/json"
               },
               "operations": [
                 {
                   "type": "Query",
                   "field": "products",
                   "path": "/products",
                   "method": "GET",
                   "responseSample": "./samples/json-schemas/products-response.json",
                   "responseTypeName": "ProductsResponse"
                 }
               ]
             }
           }
         }
       ]
     }
   }
   ```

3. **Test the initial configuration**:
   ```bash
   # Update mesh with new configuration (test deployment)
   aio api-mesh:update mesh-json-schema.json
   ```

### Step 5: Validate Basic Functionality
**Time: 30 minutes**

1. **Test the Products source individually**:
   ```graphql
   query {
     products {
       items {
         sku
         name
         price
       }
     }
   }
   ```

2. **Verify authentication is working**:
   - Check mesh logs for authentication success
   - Verify products are returned (should get some results)

3. **Document any issues encountered**:
   ```bash
   # Create issues log
   touch docs/development/migration-issues.md
   ```

## Week 1 Completion Criteria

By the end of the first week, you should have:

- ✅ **Sample Data**: Three JSON files with real API response samples
- ✅ **Basic Configuration**: JSON Schema configuration for Products source
- ✅ **Authentication**: OAuth working with JSON Schema handler
- ✅ **Basic Query**: Able to query products through new source
- ✅ **Documentation**: Issues and learnings documented

## Week 2 Preview: Resolver Migration

Next week you'll focus on:
1. **Analyzing current resolver** for reusable transformation logic
2. **Creating product-enrichment resolver** that integrates with existing `buildProducts` step
3. **Adding Categories and Inventory sources** to the mesh configuration
4. **Implementing source-specific resolvers** for category and inventory integration

## Troubleshooting

### Common Issues and Solutions

**Issue: OAuth signature not working with JSON Schema handler**
```bash
# Solution: Check header format and context variable access
# Ensure headers are properly formatted for OAuth 1.0
```

**Issue: Sample extraction fails with authentication errors**
```bash
# Solution: Verify current OAuth implementation works
npm run test:action get-products
# If this works, check script parameter handling
```

**Issue: JSON Schema handler not recognizing sample files**
```bash
# Solution: Check file paths are relative to mesh configuration
ls -la samples/json-schemas/  # Verify files exist
```

### Getting Help

1. **Check existing documentation**:
   ```bash
   grep -r "jsonSchema\|JSON Schema" docs/
   ```

2. **Review Adobe API Mesh documentation**:
   - [JSON Schema Handler Documentation](https://the-guild.dev/graphql/mesh/docs/handlers/json-schema)

3. **Test current working setup**:
   ```bash
   npm run test:action get-products-mesh
   # Use this as reference for what should work
   ```

## Success Metrics for Week 1

### Must Have (Blocking)
- [ ] Sample data extracted successfully
- [ ] Basic JSON Schema configuration working
- [ ] Products source returning data
- [ ] OAuth authentication functional

### Should Have (Important)
- [ ] Clear documentation of issues encountered
- [ ] Performance baseline established
- [ ] Understanding of data transformations needed

### Nice to Have (Future)
- [ ] Categories and Inventory samples extracted
- [ ] Initial resolver structure planned
- [ ] Performance comparison with current implementation

## Conclusion

The first week focuses on establishing the foundation for the JSON Schema multi-source approach. Take time to understand each step and document any challenges encountered. This foundation will make the subsequent weeks of resolver migration and optimization much smoother.

**Key Success Factor**: Don't rush the foundation setup. A solid base with working authentication and sample data will make the rest of the implementation much easier.

Remember: The goal is configuration transparency and resolver maintainability while preserving the current 119 product processing capability. 