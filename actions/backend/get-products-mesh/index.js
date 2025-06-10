/**
 * Adobe App Builder action for fetching products via API Mesh
 * Enhanced version using consolidated mesh resolvers
 */

const { loadConfig } = require('../../../config');
const { getAuthToken } = require('../../../src/commerce/api/integration');
const { extractActionParams } = require('../../../src/core/http/client');
const { response } = require('../../../src/core/http/responses');
const { buildRuntimeUrl } = require('../../../src/core/routing');
const { initializeAppBuilderStorage, initializeS3Storage } = require('../../../src/core/storage');
const { formatStepMessage } = require('../../../src/core/utils');

/**
 * Main action function
 * @param {Object} params - Action parameters from Adobe I/O Runtime
 * @returns {Object} Action response with product data via API Mesh
 */
async function main(params) {
  try {
    // Extract and process action parameters
    const actionParams = extractActionParams(params);

    // Load configuration
    const config = loadConfig(actionParams);

    // Check mesh configuration
    const meshConfig = config.mesh;

    if (!meshConfig || !meshConfig.endpoint) {
      return response.error('API Mesh not configured', 500, { actionParams });
    }

    const steps = [];

    // Step 1: Initialize storage directly to avoid circular dependency
    let storage;
    const provider = config.storage.provider;

    if (provider === 'app-builder') {
      storage = await initializeAppBuilderStorage(actionParams);
    } else if (provider === 's3') {
      storage = await initializeS3Storage(config, actionParams);
    } else {
      throw new Error(`Unknown storage provider: ${provider}`);
    }

    steps.push(
      formatStepMessage('Storage initialization', `Initialized ${storage.provider} storage`)
    );

    // Step 2: Get Commerce authentication token
    const commerceToken = await getAuthToken(actionParams);
    steps.push(formatStepMessage('Commerce authentication', 'Obtained admin token'));

    // Prepare GraphQL query for enhanced products using our working resolver
    const query = `
      query GetEnhancedProducts($pageSize: Int, $currentPage: Int) {
        enhanced_products(pageSize: $pageSize, currentPage: $currentPage) {
          rest_total
          catalog_total
          combined_total
          message
          status
        }
      }
    `;

    const variables = {
      pageSize: 50, // Will be used by the resolver
      currentPage: 1,
    };

    // Step 3: Execute GraphQL query via API Mesh with Commerce token
    const meshResponse = await fetch(meshConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${actionParams.MESH_API_KEY || meshConfig.apiKey}`,
        // Pass Commerce token for mesh resolvers to use
        'x-commerce-token': commerceToken,
        // Pass Catalog Service headers for mesh resolvers to use
        'x-catalog-api-key': actionParams.CATALOG_SERVICE_API_KEY,
        'x-catalog-environment-id': actionParams.CATALOG_SERVICE_ENVIRONMENT_ID,
        'x-catalog-customer-group': 'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c',
        'x-catalog-store-code': actionParams.CATALOG_SERVICE_STORE_CODE,
        'x-catalog-store-view-code': actionParams.CATALOG_SERVICE_STORE_VIEW_CODE,
        'x-catalog-website-code': actionParams.CATALOG_SERVICE_WEBSITE_CODE,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!meshResponse.ok) {
      const errorText = await meshResponse.text();
      throw new Error(
        `API Mesh request failed: ${meshResponse.status} ${meshResponse.statusText} - ${errorText}`
      );
    }

    const meshData = await meshResponse.json();

    if (meshData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(meshData.errors)}`);
    }

    if (!meshData.data || !meshData.data.enhanced_products) {
      throw new Error(`Invalid API Mesh response: ${JSON.stringify(meshData)}`);
    }

    const enhancedData = meshData.data.enhanced_products;

    if (enhancedData.status !== 'success') {
      throw new Error(`Enhanced products query failed: ${enhancedData.message}`);
    }

    steps.push(formatStepMessage('API Mesh query', `Enhanced query: ${enhancedData.message}`));

    // Step 4: Generate summary data for CSV export
    const csvData = [
      {
        metric: 'Total Products (REST API)',
        count: enhancedData.rest_total,
        description: 'All products including hidden/disabled',
      },
      {
        metric: 'Storefront Products (Catalog Service)',
        count: enhancedData.catalog_total,
        description: 'Publicly visible storefront products',
      },
      {
        metric: 'Hidden/Disabled Products',
        count: enhancedData.rest_total - enhancedData.catalog_total,
        description: 'Products not visible on storefront',
      },
      {
        metric: 'Combined Dataset',
        count: enhancedData.combined_total,
        description: 'Complete product dataset via mesh consolidation',
      },
    ];

    steps.push(
      formatStepMessage('Data consolidation', `Generated ${csvData.length} metric summaries`)
    );

    // Step 5: Generate CSV
    const csvHeaders = ['metric', 'count', 'description'];
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map((row) =>
        csvHeaders
          .map((header) => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          })
          .join(',')
      ),
    ].join('\n');
    steps.push(
      formatStepMessage(
        'CSV generation',
        `Generated consolidation report (${(csvContent.length / 1024).toFixed(2)} KB)`
      )
    );

    // Step 6: Store file
    const fileName = `products-mesh-${Date.now()}.csv`;
    const filePath = `exports/${fileName}`;
    await storage.write(filePath, csvContent);
    steps.push(formatStepMessage('File storage', `Stored as ${fileName}`));

    // Build download URL
    const downloadUrl =
      buildRuntimeUrl('download-file', null, actionParams) +
      `?fileName=${encodeURIComponent(fileName)}&path=${encodeURIComponent('exports/')}`;

    // Prepare response
    const responseData = {
      message: 'Products exported successfully via API Mesh',
      steps,
      downloadUrl,
      storage: {
        provider: storage.provider.toLowerCase().replace('_', '-'),
        location: filePath,
        properties: {
          fileName,
          fileSize: csvContent.length,
          productCount: csvData.length,
          method: 'api-mesh',
        },
      },
      performance: {
        totalProducts: enhancedData.combined_total,
        processedProducts: csvData.length,
        apiCalls: 1,
        method: 'API Mesh Enhanced (GraphQL)',
      },
    };

    return response.success(responseData, { actionParams });
  } catch (error) {
    console.error('API Mesh action failed:', error);
    return response.error(`API Mesh failed: ${error.message}`, 500, {
      actionParams: params,
      error: error.stack,
    });
  }
}

module.exports = { main };
