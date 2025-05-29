import https from 'https';

import axios from 'axios';
import dotenv from 'dotenv';
import ora from 'ora';

// Load environment variables
dotenv.config();

const BASE_URL = 'https://localhost:9080';
const ACTION_URL = `${BASE_URL}/api/v1/web/kukla-integration-service/get-products`;

console.log('🔍 Testing endpoint:', ACTION_URL);

// Create axios instance that ignores SSL verification for local testing
const client = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  // Add timeout
  timeout: 5000,
});

async function testGetProducts() {
  const spinner = ora('Testing get-products endpoint').start();

  try {
    // Verify required environment variables
    const username = process.env.COMMERCE_ADMIN_USERNAME;
    const password = process.env.COMMERCE_ADMIN_PASSWORD;

    if (!username || !password) {
      spinner.fail('Missing required environment variables');
      console.error('\nPlease set the following environment variables:');
      console.error('- COMMERCE_ADMIN_USERNAME');
      console.error('- COMMERCE_ADMIN_PASSWORD');
      process.exit(1);
    }

    console.log('\n📤 Sending request with credentials:', {
      username: username.substring(0, 3) + '...',
      password: '********',
    });

    // Make the request
    const response = await client.post(ACTION_URL, {
      COMMERCE_ADMIN_USERNAME: username,
      COMMERCE_ADMIN_PASSWORD: password,
    });

    spinner.succeed('Request successful');

    // Pretty print the response
    console.log('\n📥 Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    spinner.fail('Request failed');

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('\n❌ Error Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('\n📊 Status:', error.response.status);
      console.error('📋 Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('\n❌ No response received from server');
      console.error('🔍 Error details:', error.message);
      console.error('\n💡 Troubleshooting tips:');
      console.error('1. Is the API server running? (npm run start:api)');
      console.error('2. Check if the server is using a different port');
      console.error('3. Try accessing the URL in your browser:', ACTION_URL);
    } else {
      // Something happened in setting up the request
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testGetProducts();
