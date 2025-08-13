#!/usr/bin/env node

/**
 * CLI Authentication Script for Adobe App Builder
 * Handles browser-based IMS authentication for test scripts
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const chalk = require('chalk');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Token storage location (similar to AWS/GitHub CLI)
const TOKEN_FILE = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.kukla-integration',
  'credentials.json'
);

/**
 * Ensure token directory exists
 */
function ensureTokenDir() {
  const dir = path.dirname(TOKEN_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save tokens to local storage
 */
function saveTokens(tokens) {
  ensureTokenDir();
  const data = {
    ...tokens,
    expires_at: Date.now() + (tokens.expires_in * 1000),
    created_at: Date.now()
  };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  // Secure file permissions (read/write for owner only)
  fs.chmodSync(TOKEN_FILE, 0o600);
}

/**
 * Load tokens from local storage
 */
function loadTokens() {
  if (!fs.existsSync(TOKEN_FILE)) {
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    
    // Check if token is expired (with 5 minute buffer)
    const bufferMs = 5 * 60 * 1000;
    if (data.expires_at && Date.now() >= (data.expires_at - bufferMs)) {
      console.log(chalk.yellow('Token expired'));
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(chalk.red('Error reading token file:', error.message));
    return null;
  }
}

/**
 * Clear stored tokens
 */
function clearTokens() {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log(chalk.green('✔ Cleared stored credentials'));
  }
}

/**
 * Start local server for OAuth callback
 */
async function startCallbackServer(port = 8080) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        
        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h2 style="color: #dc3545;">Authentication Failed</h2>
                <p>${error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(error));
          return;
        }
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h2 style="color: #28a745;">Authentication Successful!</h2>
                <p>You can close this window and return to the terminal.</p>
                <script>window.setTimeout(() => window.close(), 2000);</script>
              </body>
            </html>
          `);
          server.close();
          resolve({ code, state });
        }
      }
    });
    
    server.listen(port, () => {
      console.log(chalk.gray(`Callback server listening on port ${port}`));
    });
  });
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, redirectUri) {
  const clientId = process.env.IMS_CLIENT_ID;
  const clientSecret = process.env.IMS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('IMS_CLIENT_ID and IMS_CLIENT_SECRET must be set in .env file');
  }
  
  const tokenUrl = 'https://ims-na1.adobelogin.com/ims/token/v3';
  
  const formData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: formData.toString()
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || 'Token exchange failed');
  }
  
  return data;
}

/**
 * Perform browser-based authentication
 */
async function authenticate() {
  const clientId = process.env.IMS_CLIENT_ID;
  
  if (!clientId) {
    console.error(chalk.red('Error: IMS_CLIENT_ID not found in .env file'));
    console.log(chalk.yellow('Please configure OAuth Web App credentials first'));
    process.exit(1);
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Use localhost callback
  const port = 8080;
  const redirectUri = `http://localhost:${port}/callback`;
  
  // Build IMS authorization URL
  const authUrl = new URL('https://ims-na1.adobelogin.com/ims/authorize/v2');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'openid,AdobeID');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  
  console.log(chalk.cyan('\n🔐 Adobe IMS Authentication\n'));
  console.log('Opening browser for authentication...');
  console.log(chalk.gray(`If browser doesn't open, visit: ${authUrl.toString()}\n`));
  
  // Start callback server
  const serverPromise = startCallbackServer(port);
  
  // Open browser
  const openCommand = process.platform === 'darwin' ? 'open' :
                      process.platform === 'win32' ? 'start' :
                      'xdg-open';
  
  try {
    execSync(`${openCommand} "${authUrl.toString()}"`);
  } catch (error) {
    console.log(chalk.yellow('Could not open browser automatically'));
  }
  
  // Wait for callback
  console.log('Waiting for authentication...\n');
  
  try {
    const { code, state: returnedState } = await serverPromise;
    
    // Validate state
    if (returnedState !== state) {
      throw new Error('State mismatch - possible CSRF attack');
    }
    
    // Exchange code for token
    console.log(chalk.gray('Exchanging authorization code for token...'));
    const tokens = await exchangeCodeForToken(code, redirectUri);
    
    // Save tokens
    saveTokens(tokens);
    
    console.log(chalk.green('\n✅ Authentication successful!'));
    console.log(chalk.gray(`Tokens saved to: ${TOKEN_FILE}`));
    
    // Extract user info if available
    try {
      if (tokens.access_token) {
        const tokenParts = tokens.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          if (payload.email) {
            console.log(chalk.gray(`Authenticated as: ${payload.email}`));
          }
        }
      }
    } catch (e) {
      // Ignore token parsing errors
    }
    
    console.log(chalk.cyan('\nYou can now run test scripts with authentication:'));
    console.log('  npm run test:action get-products');
    
  } catch (error) {
    console.error(chalk.red('\n❌ Authentication failed:', error.message));
    process.exit(1);
  }
}

/**
 * Check authentication status
 */
function checkStatus() {
  const tokens = loadTokens();
  
  if (!tokens) {
    console.log(chalk.yellow('Not authenticated'));
    console.log(chalk.gray('Run "npm run auth:login" to authenticate'));
    return false;
  }
  
  console.log(chalk.green('✔ Authenticated'));
  
  const expiresIn = Math.floor((tokens.expires_at - Date.now()) / 1000);
  const hours = Math.floor(expiresIn / 3600);
  const minutes = Math.floor((expiresIn % 3600) / 60);
  
  console.log(chalk.gray(`Token expires in: ${hours}h ${minutes}m`));
  
  // Show user info if available
  try {
    if (tokens.access_token) {
      const tokenParts = tokens.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        if (payload.email) {
          console.log(chalk.gray(`Authenticated as: ${payload.email}`));
        }
      }
    }
  } catch (e) {
    // Ignore token parsing errors
  }
  
  return true;
}

/**
 * Get valid access token
 */
function getToken() {
  const tokens = loadTokens();
  
  if (!tokens || !tokens.access_token) {
    console.error(chalk.red('Not authenticated. Run "npm run auth:login" first'));
    process.exit(1);
  }
  
  return tokens.access_token;
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'login':
      await authenticate();
      break;
      
    case 'logout':
      clearTokens();
      break;
      
    case 'status':
      checkStatus();
      break;
      
    case 'token':
      // Silent mode - just output token for use in scripts
      const token = getToken();
      console.log(token);
      break;
      
    default:
      console.log(chalk.cyan('Adobe IMS Authentication for CLI\n'));
      console.log('Usage:');
      console.log('  npm run auth:login    - Authenticate with Adobe IMS');
      console.log('  npm run auth:logout   - Clear stored credentials');
      console.log('  npm run auth:status   - Check authentication status');
      console.log('');
      console.log('Authentication is required to run any test scripts.');
  }
}

// Export for use in other scripts
module.exports = {
  loadTokens,
  getToken,
  checkStatus
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Error:', error.message));
    process.exit(1);
  });
}