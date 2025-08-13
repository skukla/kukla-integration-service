# IMS Authentication Module

Modular Adobe IMS authentication for the App Builder frontend application.

## Overview

This module provides Adobe IMS (Identity Management System) authentication for the web frontend while maintaining compatibility with service-to-service authentication for CLI/npm scripts.

## Features

- **Dual Authentication Support**: Web UI (IMS) and CLI (service credentials)
- **Modular Design**: Easy to remove when integrating with Adobe Commerce Admin SDK
- **Secure Token Management**: Uses sessionStorage for token storage
- **Automatic Token Handling**: Adds auth headers to all HTMX requests
- **CSRF Protection**: State validation for OAuth flow

## Configuration

### Environment Variables

Set in `.env` file:

```env
# Enable/disable IMS authentication
IMS_AUTH_ENABLED=true

# IMS Client ID from Adobe Developer Console
IMS_CLIENT_ID=your_client_id

# IMS Scopes (optional, defaults shown)
IMS_SCOPE=openid,AdobeID,read_organizations
```

### Adobe Developer Console Setup

1. Create an OAuth Web App integration
2. Add redirect URI: `https://your-app-domain.com/auth/callback`
3. Configure scopes based on your needs
4. Copy the Client ID to your `.env` file

## How It Works

### Frontend Flow

1. User accesses the web application
2. Auth module checks for valid IMS token
3. If not authenticated, redirects to Adobe IMS login
4. After successful login, IMS redirects back with token
5. Token stored in sessionStorage
6. All API requests include the IMS token

### Backend Flow

Actions validate authentication using dual method:

```javascript
// Backend action authentication
const authResult = await validateAuth(params);

if (authResult.authenticated) {
  // Use Commerce credentials from authResult
  const { username, password } = authResult.commerceAuth;
}
```

### CLI/Script Flow

npm scripts continue to work as before:
- Pass Commerce credentials as parameters
- No browser authentication required
- Backend accepts service credentials

## Disabling Authentication

To disable IMS authentication:

1. Set in `.env`:
   ```env
   IMS_AUTH_ENABLED=false
   ```

2. Or remove IMS_CLIENT_ID from environment

When disabled:
- Web UI won't require login
- Backend requires Commerce credentials for all requests
- npm scripts work unchanged

## Security Considerations

- Tokens stored in sessionStorage (not localStorage)
- CSRF protection via state parameter
- Automatic redirect on 401 responses
- Token validation on both frontend and backend

## Removal for Adobe Commerce Admin SDK

When integrating with Adobe Commerce Admin SDK:

1. Remove auth module directory: `web-src/src/js/auth/`
2. Remove auth initialization from `main.js`
3. Remove auth headers from `htmx/setup.js`
4. Remove IMS validation from backend actions
5. Remove IMS config from build script

The modular design ensures clean removal without affecting core functionality.