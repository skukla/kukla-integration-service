#!/usr/bin/env node

/**
 * Extract Sample Data for JSON Schema
 *
 * This script extracts actual API responses from Commerce API to generate
 * JSON Schema type definitions for the mesh configuration.
 */

const fs = require('fs').promises;
const path = require('path');

const { loadConfig } = require('../config');
const { makeCommerceRequest } = require('../src/commerce').api.integration;
const { extractActionParams } = require('../src/core/http/client');

/**
 * Load environment variables from .env file
 */
async function loadEnvironmentParams() {
  const envPath = path.join(process.cwd(), '.env');
  try {
    const envContent = await fs.readFile(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    throw new Error(`Failed to load .env file: ${error.message}`);
  }
}

/**
 * Extract inventory data for given SKUs
 */
async function extractInventoryData(skus, config, params) {
  if (skus.length === 0) {
    return createMockInventoryData();
  }

  console.log('Using SKUs for inventory:', skus);

  for (const sku of skus.slice(0, 1)) {
    try {
      const response = await makeCommerceRequest(
        `/stockItems/${sku}`,
        { method: 'GET' },
        config,
        params
      );
      return response.body || response;
    } catch (error) {
      console.log(`Inventory for SKU ${sku} not found, trying next...`);
    }
  }

  return createMockInventoryData();
}

/**
 * Create mock inventory data structure
 */
function createMockInventoryData() {
  console.log('No inventory data found - creating mock structure');
  return {
    item_id: 1,
    product_id: 1,
    stock_id: 1,
    qty: 100,
    is_in_stock: true,
    is_qty_decimal: false,
    show_default_notification_message: false,
    use_config_min_qty: true,
    min_qty: 0,
    use_config_min_sale_qty: true,
    min_sale_qty: 1,
    use_config_max_sale_qty: true,
    max_sale_qty: 10000,
    use_config_backorders: true,
    backorders: 0,
    use_config_notify_stock_qty: true,
    notify_stock_qty: 1,
    use_config_qty_increments: true,
    qty_increments: 0,
    use_config_enable_qty_inc: true,
    enable_qty_increments: false,
    use_config_manage_stock: true,
    manage_stock: true,
    low_stock_date: null,
    is_decimal_divided: false,
    stock_status_changed_auto: 0,
  };
}

/**
 * Extract sample data from Commerce API
 */
async function extractSamples() {
  try {
    console.log('🔍 Extracting sample data for JSON Schema...');

    // Load configuration and parameters
    const envParams = await loadEnvironmentParams();
    const params = extractActionParams(envParams);
    const config = loadConfig(params);

    console.log(`🔗 Commerce URL: ${config.commerce.baseUrl}`);
    console.log(
      `🔑 Using OAuth credentials: ${params.COMMERCE_CONSUMER_KEY ? 'Present' : 'Missing'}\n`
    );

    console.log('📦 Extracting Products sample...');

    // Extract products sample
    const productsResponse = await makeCommerceRequest(
      '/products?searchCriteria[pageSize]=5&searchCriteria[currentPage]=1',
      {
        method: 'GET',
      },
      config,
      params
    );

    // Extract response body from HTTP response
    const productsData = productsResponse.body || productsResponse;

    console.log('DEBUG: Products response structure:', {
      statusCode: productsResponse.statusCode,
      hasBody: !!productsResponse.body,
      hasItems: !!productsData.items,
      itemsLength: productsData.items?.length || 0,
      totalCount: productsData.total_count || 0,
      firstItemSku: productsData.items?.[0]?.sku,
    });

    console.log('📂 Extracting Categories sample...');

    // Extract categories sample - try common category IDs
    const categoryIds = [2, 3, 4, 5]; // Default category, root categories
    let categoriesResponse = null;

    for (const categoryId of categoryIds) {
      try {
        categoriesResponse = await makeCommerceRequest(
          `/categories/${categoryId}`,
          {
            method: 'GET',
          },
          config,
          params
        );
        break; // Use first successful response
      } catch (error) {
        console.log(`Category ${categoryId} not found, trying next...`);
      }
    }

    if (!categoriesResponse) {
      throw new Error('No categories found in API responses');
    }

    // Extract response body from HTTP response
    const categoriesData = categoriesResponse.body || categoriesResponse;

    console.log('📊 Extracting Inventory sample...');

    // Extract inventory sample from actual SKUs
    const sampleSkus = (productsData.items || [])
      .slice(0, 3)
      .map((product) => product.sku)
      .filter(Boolean);

    const inventoryData = await extractInventoryData(sampleSkus, config, params);

    // Create samples directory
    const samplesDir = path.join(__dirname, '..', 'samples', 'json-schema');
    await fs.mkdir(samplesDir, { recursive: true });

    // Save samples
    await fs.writeFile(
      path.join(samplesDir, 'products-response.json'),
      JSON.stringify(productsData, null, 2)
    );

    await fs.writeFile(
      path.join(samplesDir, 'categories-response.json'),
      JSON.stringify(categoriesData, null, 2)
    );

    await fs.writeFile(
      path.join(samplesDir, 'inventory-response.json'),
      JSON.stringify(inventoryData, null, 2)
    );

    console.log('✅ Sample data extracted successfully!');
    console.log('📁 Samples saved to:', samplesDir);

    // Show sample sizes
    console.log('\n📊 Sample Statistics:');
    console.log(`- Products: ${productsData.items?.length || 0} items`);
    console.log('- Categories: 1 category sample');
    console.log(`- Inventory: ${inventoryData ? 1 : 0} items`);
  } catch (error) {
    console.error('❌ Error extracting samples:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  extractSamples();
}

module.exports = { extractSamples };
