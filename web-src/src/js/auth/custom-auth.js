/**
 * Custom Authentication Module
 * Provides simple password-based authentication for standalone App Builder SPAs
 * This is used when IMS OAuth Web credentials are not available
 */

/**
 * Custom Auth Manager
 * Simple session-based authentication with password
 */
export class CustomAuth {
  constructor() {
    this.authenticated = false;
    this.authKey = 'app_auth_token';
    this.passwordHash = null;
  }

  /**
   * Initialize custom authentication
   * @returns {Promise<boolean>} True if authenticated
   */
  async initialize() {
    // Check if we have a valid session
    const token = sessionStorage.getItem(this.authKey);
    if (token && this.validateToken(token)) {
      this.authenticated = true;
      return true;
    }

    // Show login prompt
    return this.showLoginPrompt();
  }

  /**
   * Show login prompt
   * @returns {Promise<boolean>} True if login successful
   */
  async showLoginPrompt() {
    // Create login overlay
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-modal">
        <div class="auth-header">
          <h2>Authentication Required</h2>
          <p>Please enter the application password to continue</p>
        </div>
        <form class="auth-form" id="auth-form">
          <div class="form-group">
            <label for="app-password">Password</label>
            <input 
              type="password" 
              id="app-password" 
              name="password" 
              required 
              autofocus
              placeholder="Enter application password"
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Sign In</button>
          </div>
          <div id="auth-error" class="auth-error" style="display: none;"></div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    return new Promise((resolve) => {
      const form = document.getElementById('auth-form');
      const errorDiv = document.getElementById('auth-error');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = form.password.value;
        const isValid = await this.validatePassword(password);
        
        if (isValid) {
          // Generate and store token
          const token = this.generateToken(password);
          sessionStorage.setItem(this.authKey, token);
          this.authenticated = true;
          
          // Remove overlay
          overlay.remove();
          resolve(true);
        } else {
          errorDiv.textContent = 'Invalid password. Please try again.';
          errorDiv.style.display = 'block';
          form.password.value = '';
          form.password.focus();
        }
      });
    });
  }

  /**
   * Validate password against backend
   * @param {string} password - Password to validate
   * @returns {Promise<boolean>} True if valid
   */
  async validatePassword(password) {
    try {
      // Call backend action to validate the password using modular handler
      const response = await fetch('/api/auth-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          operation: 'validate-password',
          password: password 
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.valid === true;
      }
      
      return false;
    } catch (error) {
      console.error('Password validation failed:', error);
      // In development, you might want to allow access on error
      // return process.env.NODE_ENV === 'development';
      return false;
    }
  }

  /**
   * Generate a simple token from password
   * @param {string} password - Password
   * @returns {string} Token
   */
  generateToken(password) {
    // Simple hash for session validation
    // In production, this should be a proper token from the backend
    const timestamp = Date.now();
    return btoa(`${password}:${timestamp}`);
  }

  /**
   * Validate stored token
   * @param {string} token - Token to validate
   * @returns {boolean} True if valid
   */
  validateToken(token) {
    try {
      const decoded = atob(token);
      const [, timestamp] = decoded.split(':');
      
      // Token expires after 24 hours
      const expiryTime = 24 * 60 * 60 * 1000;
      return (Date.now() - parseInt(timestamp)) < expiryTime;
    } catch {
      return false;
    }
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with auth token
   */
  getAuthHeaders() {
    const token = sessionStorage.getItem(this.authKey);
    if (token) {
      return {
        'X-App-Auth': token
      };
    }
    return {};
  }

  /**
   * Logout
   */
  logout() {
    sessionStorage.removeItem(this.authKey);
    this.authenticated = false;
    window.location.reload();
  }

  /**
   * Check if authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.authenticated;
  }
}

// Export singleton instance
export const customAuth = new CustomAuth();