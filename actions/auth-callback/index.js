/**
 * Adobe App Builder Action: OAuth Callback Handler
 * Handles the OAuth callback and returns an HTML page that completes authentication
 */

const { Core } = require('@adobe/aio-sdk');

async function main(params) {
  const logger = Core.Logger('auth-callback', { level: params.LOG_LEVEL || 'info' });
  
  // Get query parameters
  const code = params.code;
  const state = params.state;
  const error = params.error;
  const errorDescription = params.error_description;
  
  logger.info('OAuth callback received', { 
    hasCode: !!code, 
    hasState: !!state, 
    hasError: !!error 
  });
  
  // Return HTML page that handles the authentication client-side
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication - Adobe App Builder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .auth-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      color: #dc3545;
      margin-top: 1rem;
    }
    .success {
      color: #28a745;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="spinner"></div>
    <h2>Processing Authentication...</h2>
    <p id="status">Exchanging authorization code for access token...</p>
    <div id="message"></div>
  </div>

  <script type="module">
    async function handleCallback() {
      const statusEl = document.getElementById('status');
      const messageEl = document.getElementById('message');
      
      // Get parameters from current URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code') || '${code || ''}';
      const state = urlParams.get('state') || '${state || ''}';
      const error = urlParams.get('error') || '${error || ''}';
      const errorDescription = urlParams.get('error_description') || '${errorDescription || ''}';
      
      // Handle errors from IMS
      if (error) {
        statusEl.textContent = 'Authentication failed';
        messageEl.className = 'error';
        messageEl.textContent = errorDescription || error;
        return;
      }
      
      // Validate state to prevent CSRF
      const savedState = sessionStorage.getItem('ims_auth_state');
      if (state && savedState && state !== savedState) {
        statusEl.textContent = 'Security validation failed';
        messageEl.className = 'error';
        messageEl.textContent = 'State mismatch - possible security issue. Please try again.';
        sessionStorage.removeItem('ims_auth_state');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
        return;
      }
      
      if (code) {
        try {
          // Exchange authorization code for access token via backend
          const response = await fetch('/api/auth-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              operation: 'ims-exchange',
              code: code,
              state: state,
              redirect_uri: window.location.origin + '/callback'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Token exchange failed');
          }
          
          const tokenData = await response.json();
          
          // Store token and metadata
          const expiresAt = Date.now() + ((tokenData.expires_in || 86400) * 1000);
          sessionStorage.setItem('ims_access_token', tokenData.access_token);
          sessionStorage.setItem('ims_expires_at', expiresAt.toString());
          
          // Store user info if available
          if (tokenData.user_id) {
            sessionStorage.setItem('ims_user_id', tokenData.user_id);
          }
          if (tokenData.org_id) {
            sessionStorage.setItem('ims_org_id', tokenData.org_id);
          }
          
          // Clean up and show success
          sessionStorage.removeItem('ims_auth_state');
          statusEl.textContent = 'Authentication successful!';
          messageEl.className = 'success';
          messageEl.textContent = 'Redirecting to application...';
          
          // Redirect to main app
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          
        } catch (error) {
          statusEl.textContent = 'Authentication failed';
          messageEl.className = 'error';
          messageEl.textContent = error.message;
          
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } else {
        statusEl.textContent = 'Authentication failed';
        messageEl.className = 'error';
        messageEl.textContent = 'No authorization code received';
        
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    }
    
    // Handle the callback immediately
    handleCallback();
  </script>
</body>
</html>`;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: html
  };
}

exports.main = main;