// api.js - Backend API client integration for EasyCafe
const API_BASE_URL = 'http://localhost:3000';

class EasyCafeAPI {
  constructor() {
    this.accessToken = localStorage.getItem('easycafe_access_token') || null;
    this.refreshToken = localStorage.getItem('easycafe_refresh_token') || null;
    this.user = JSON.parse(localStorage.getItem('easycafe_user')) || null;
  }

  // Check if admin is currently authenticated
  isAdminAuthenticated() {
    return !!this.accessToken;
  }

  // Get current logged in user info
  getCurrentUser() {
    return this.user;
  }

  // Set tokens
  setTokens(accessToken, refreshToken, user) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
    localStorage.setItem('easycafe_access_token', accessToken);
    localStorage.setItem('easycafe_refresh_token', refreshToken);
    localStorage.setItem('easycafe_user', JSON.stringify(user));
  }

  // Clear session
  clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('easycafe_access_token');
    localStorage.removeItem('easycafe_refresh_token');
    localStorage.removeItem('easycafe_user');
  }

  // Helper fetch wrapper supporting authorization headers, auto-retry, and refresh tokens
  async fetchWithAuth(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    options.headers = options.headers || {};
    if (this.accessToken && !options.skipAuth) {
      options.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, options);

      // Handle token expiration & retry
      if (response.status === 401 && this.refreshToken && !options.isRetry && !options.skipAuth) {
        this.logger?.log('Access token expired. Attempting refresh...');
        const refreshSuccess = await this.refreshSession();
        if (refreshSuccess) {
          options.headers['Authorization'] = `Bearer ${this.accessToken}`;
          options.isRetry = true;
          response = await fetch(url, options);
        } else {
          this.clearSession();
          window.location.reload(); // Redirect/force login reload
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Call failed to: ${endpoint}`, error);
      throw error;
    }
  }

  // Refresh Session via Refresh Token
  async refreshSession() {
    if (!this.refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        localStorage.setItem('easycafe_access_token', this.accessToken);
        return true;
      }
    } catch (e) {
      console.error('Refresh token exchange failed:', e);
    }
    return false;
  }

  // --- PUBLIC ENDPOINTS ---

  // Track single application
  async trackApplication(id) {
    return this.fetchWithAuth(`/applications/${id}`);
  }

  // Submit application
  async submitApplication(applicationData) {
    return this.fetchWithAuth('/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData),
    });
  }

  // Upload file (PDF, JPG, PNG)
  async uploadDocument(file, folder = 'applications') {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/uploads?folder=${folder}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // Do not add Content-Type, browser will set it with boundary
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'File upload failed');
    }

    return await response.json();
  }

  // Initiate Payment Order (returns session ID / simulated session)
  async createPaymentOrder(applicationId) {
    return this.fetchWithAuth('/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
    });
  }

  // Pull PG verify
  async verifyPayment(orderId) {
    return this.fetchWithAuth(`/payments/verify/${orderId}`);
  }

  // Simulate payment (sandbox developer method)
  async simulatePayment(orderId, status) {
    return this.fetchWithAuth('/payments/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
  }

  // --- STAFF/ADMIN AUTH & CONTROL ---

  // Admin Log In (with offline fallback when backend is not running)
  async login(email, password) {
    // ── Offline / demo fallback credentials ──────────────────────────────
    // Used when the NestJS backend server is not running locally.
    const OFFLINE_ADMIN_EMAIL    = 'admin@easycafe.com';
    const OFFLINE_ADMIN_PASSWORD = 'AdminPassword123!';
    // ─────────────────────────────────────────────────────────────────────

    try {
      const response = await this.fetchWithAuth('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      if (response && response.access_token) {
        this.setTokens(response.access_token, response.refresh_token, response.user);
        return response.user;
      }
      throw new Error('Authentication failed');

    } catch (err) {
      // If the error is a network/fetch failure (backend not running),
      // check against the offline fallback credentials.
      const isNetworkError = err instanceof TypeError ||
                             (err.message && (
                               err.message.includes('fetch') ||
                               err.message.includes('network') ||
                               err.message.includes('Failed to fetch') ||
                               err.message.includes('NetworkError') ||
                               err.message.includes('ECONNREFUSED')
                             ));

      if (isNetworkError) {
        if (email === OFFLINE_ADMIN_EMAIL && password === OFFLINE_ADMIN_PASSWORD) {
          // Simulate a successful offline session
          const fakeToken = 'offline_admin_token_' + Date.now();
          const fakeUser  = { id: 1, email: OFFLINE_ADMIN_EMAIL, name: 'Admin', role: 'admin' };
          this.setTokens(fakeToken, fakeToken, fakeUser);
          return fakeUser;
        } else {
          throw new Error('Invalid email or password.');
        }
      }

      // Re-throw any other errors (e.g., 401 Unauthorized from a live server)
      throw err;
    }
  }

  // Log Out
  async logout() {
    if (this.refreshToken) {
      try {
        await this.fetchWithAuth('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
          skipAuth: true,
        });
      } catch (e) {
        // ignore
      }
    }
    this.clearSession();
  }

  // Get Admin dashboard statistics, recent lists
  async getAdminStats() {
    return this.fetchWithAuth('/admin/stats');
  }

  // List applications for admin review
  async listApplications(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.fetchWithAuth(`/applications${queryStr}`);
  }

  // Update Status
  async updateApplicationStatus(id, updateData) {
    return this.fetchWithAuth(`/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  }

  // Get Export CSV Download Link
  getExportCsvUrl() {
    return `${API_BASE_URL}/admin/export/csv?access_token=${this.accessToken}`;
  }
}

// Instantiate globally
window.api = new EasyCafeAPI();
