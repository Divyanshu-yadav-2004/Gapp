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

  // Helper to check if an error is a network connection error
  isNetworkError(err) {
    return err instanceof TypeError ||
           (err.message && (
             err.message.includes('fetch') ||
             err.message.includes('network') ||
             err.message.includes('Failed to fetch') ||
             err.message.includes('NetworkError') ||
             err.message.includes('ECONNREFUSED') ||
             err.message.includes('Failed to execute')
           ));
  }

  // --- PUBLIC ENDPOINTS ---

  // Track single application
  async trackApplication(id) {
    try {
      return await this.fetchWithAuth(`/applications/${id}`);
    } catch (err) {
      if (this.isNetworkError(err)) {
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[id];
        if (app) return app;
        throw new Error('Application not found');
      }
      throw err;
    }
  }

  // Submit application
  async submitApplication(applicationData) {
    try {
      return await this.fetchWithAuth('/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating application submission fallback...');
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockId = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const mockApplication = {
          id: mockId,
          ...applicationData,
          status: applicationData.amountPaid === 0 ? 'PENDING' : 'UNPAID', // Unpaid if it requires fee
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOfflineMock: true
        };

        // Save to mock database
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        mockDb[mockId] = mockApplication;
        localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));

        // Save to offline queue for sync
        const offlineQueue = JSON.parse(localStorage.getItem('easycafe_offline_submissions') || '[]');
        offlineQueue.push({
          mockId: mockId,
          payload: applicationData,
          createdAt: new Date().toISOString(),
          isPaid: applicationData.amountPaid === 0
        });
        localStorage.setItem('easycafe_offline_submissions', JSON.stringify(offlineQueue));

        return mockApplication;
      }
      throw err;
    }
  }

  // Upload file (PDF, JPG, PNG) with progress callback
  async uploadDocument(file, folder = 'applications', onProgress = null) {
    const url = `${API_BASE_URL}/uploads?folder=${folder}`;
    
    // Client-side file type and size validation
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileName = file.name || '';
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds the 5MB limit.');
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Setup progress listener
      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total);
            onProgress(percentage);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.message || 'File upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new TypeError('Failed to fetch'));
      };

      xhr.open('POST', url);
      xhr.send(formData);
    }).catch(async (err) => {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating local file upload with progress fallback...');
        
        // Mock progress updates
        if (onProgress) {
          const steps = [10, 35, 60, 85, 100];
          for (const step of steps) {
            await new Promise((r) => setTimeout(r, 120));
            onProgress(step);
          }
        } else {
          await new Promise((r) => setTimeout(r, 600));
        }

        const localUrl = URL.createObjectURL(file);
        return { url: localUrl };
      }
      throw err;
    });
  }

  // Initiate Payment Order (returns session ID / simulated session)
  async createPaymentOrder(applicationId) {
    try {
      return await this.fetchWithAuth('/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating payment order creation fallback...');
        await new Promise((resolve) => setTimeout(resolve, 400));
        const mockOrderId = 'ORDER-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[applicationId];
        if (app) {
          app.orderId = mockOrderId;
          mockDb[applicationId] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
        }

        // Update the offline sync queue item as well
        const offlineQueue = JSON.parse(localStorage.getItem('easycafe_offline_submissions') || '[]');
        const queueItem = offlineQueue.find(item => item.mockId === applicationId);
        if (queueItem) {
          queueItem.orderId = mockOrderId;
          localStorage.setItem('easycafe_offline_submissions', JSON.stringify(offlineQueue));
        }

        return {
          order_id: mockOrderId,
          payment_session_id: 'mock_session_' + Date.now()
        };
      }
      throw err;
    }
  }

  // Verify Razorpay payment signature
  async verifyPaymentSignature(paymentDetails) {
    try {
      return await this.fetchWithAuth('/payments/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails),
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating payment signature verification...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const orderId = paymentDetails.razorpay_order_id;
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = Object.values(mockDb).find(a => a.orderId === orderId);
        if (app) {
          app.status = 'PENDING';
          app.paymentDetails = { status: 'SUCCESS', transactionId: paymentDetails.razorpay_payment_id || 'TXN-' + Date.now() };
          app.updatedAt = new Date().toISOString();
          mockDb[app.id] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
        }

        // Mark offline sync queue item as paid
        const offlineQueue = JSON.parse(localStorage.getItem('easycafe_offline_submissions') || '[]');
        const queueItem = offlineQueue.find(item => item.orderId === orderId);
        if (queueItem) {
          queueItem.isPaid = true;
          localStorage.setItem('easycafe_offline_submissions', JSON.stringify(offlineQueue));
        }

        return {
          status: 'SUCCESS',
          transactionId: paymentDetails.razorpay_payment_id || 'TXN-MOCK-' + Date.now()
        };
      }
      throw err;
    }
  }

  // Pull PG verify
  async verifyPayment(orderId) {
    try {
      return await this.fetchWithAuth(`/payments/verify/${orderId}`);
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating payment verification fallback...');
        await new Promise((resolve) => setTimeout(resolve, 600));

        const mockStatus = sessionStorage.getItem(`mock_pay_status_${orderId}`) || 'SUCCESS';
        
        if (mockStatus === 'SUCCESS') {
          const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
          const app = Object.values(mockDb).find(a => a.orderId === orderId);
          if (app) {
            app.status = 'PENDING';
            app.paymentDetails = { status: 'SUCCESS', transactionId: 'TXN-' + Date.now() };
            app.updatedAt = new Date().toISOString();
            mockDb[app.id] = app;
            localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
          }

          // Mark offline sync queue item as paid
          const offlineQueue = JSON.parse(localStorage.getItem('easycafe_offline_submissions') || '[]');
          const queueItem = offlineQueue.find(item => item.orderId === orderId);
          if (queueItem) {
            queueItem.isPaid = true;
            localStorage.setItem('easycafe_offline_submissions', JSON.stringify(offlineQueue));
          }
        }

        return { status: mockStatus };
      }
      throw err;
    }
  }

  // Get manual payment config (cached after first fetch)
  async getPaymentConfig() {
    if (this._paymentConfigCache) return this._paymentConfigCache;
    try {
      const config = await this.fetchWithAuth('/payments/config');
      this._paymentConfigCache = config;
      return config;
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Returning simulated payment config...');
        const fallback = {
          upiId: 'paytmqr6wi94q@ptys',
          payeeName: 'SUCCESS MP ONLINE',
          whatsappNumber: '917415921990'
        };
        this._paymentConfigCache = fallback;
        return fallback;
      }
      throw err;
    }
  }

  // Log that whatsapp message button has been clicked
  async logWhatsAppSent(applicationId) {
    try {
      return await this.fetchWithAuth(`/payments/whatsapp-sent/${applicationId}`, {
        method: 'POST',
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating whatsapp-sent logging...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[applicationId];
        if (app) {
          app.paymentDetails = app.paymentDetails || {};
          app.paymentDetails.status = 'SENT';
          app.updatedAt = new Date().toISOString();
          mockDb[applicationId] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
        }
        return { status: 'success' };
      }
      throw err;
    }
  }

  // Mark payment request as seen by admin
  async markAsSeen(applicationId) {
    try {
      return await this.fetchWithAuth(`/payments/seen/${applicationId}`, {
        method: 'POST',
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating seen log...');
        return { status: 'success' };
      }
      throw err;
    }
  }

  // Confirm payment manually (Admin)
  async confirmPaymentManually(applicationId) {
    try {
      return await this.fetchWithAuth(`/payments/confirm/${applicationId}`, {
        method: 'POST',
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating manual payment confirmation...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[applicationId];
        if (app) {
          app.paymentStatus = 'Paid';
          app.status = 'PENDING_VERIFICATION'; // Let it remain pending operator verification
          app.paymentDetails = app.paymentDetails || {};
          app.paymentDetails.status = 'VERIFIED';
          app.paymentDetails.transactionId = 'MANUAL-MOCK-' + Date.now();
          app.updatedAt = new Date().toISOString();
          mockDb[applicationId] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
        }
        return { status: 'success' };
      }
      throw err;
    }
  }

  // Reject payment manually (Admin)
  async rejectPaymentManually(applicationId) {
    try {
      return await this.fetchWithAuth(`/payments/reject/${applicationId}`, {
        method: 'POST',
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating manual payment rejection...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[applicationId];
        if (app) {
          app.paymentStatus = 'Failed';
          app.paymentDetails = app.paymentDetails || {};
          app.paymentDetails.status = 'REJECTED';
          app.updatedAt = new Date().toISOString();
          mockDb[applicationId] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
        }
        return { status: 'success' };
      }
      throw err;
    }
  }

  // Simulate payment (sandbox developer method)
  async simulatePayment(orderId, status) {
    try {
      return await this.fetchWithAuth('/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        sessionStorage.setItem(`mock_pay_status_${orderId}`, (status === 'success' || status === 'SUCCESS') ? 'SUCCESS' : 'FAILED');
        return { success: true };
      }
      throw err;
    }
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
      if (this.isNetworkError(err)) {
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
    try {
      return await this.fetchWithAuth('/admin/stats');
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating admin stats fallback...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const apps = Object.values(mockDb);
        const stats = {
          total: apps.length,
          pending: apps.filter(a => a.status === 'PENDING').length,
          processing: apps.filter(a => a.status === 'PROCESSING').length,
          approved: apps.filter(a => a.status === 'APPROVED').length,
          rejected: apps.filter(a => a.status === 'REJECTED').length,
          revenue: apps.reduce((sum, a) => sum + (a.status !== 'UNPAID' ? (a.amountPaid || 0) : 0), 0)
        };
        return stats;
      }
      throw err;
    }
  }

  // List applications for admin review
  async listApplications(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await this.fetchWithAuth(`/applications${queryStr}`);
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating list applications fallback...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        let apps = Object.values(mockDb);

        // Apply filters
        if (filters.search) {
          const s = filters.search.toLowerCase();
          apps = apps.filter(a => 
            a.id.toLowerCase().includes(s) || 
            (a.customerName && a.customerName.toLowerCase().includes(s)) ||
            (a.customerPhone && a.customerPhone.includes(s))
          );
        }
        if (filters.status && filters.status !== 'all') {
          apps = apps.filter(a => a.status === filters.status);
        }

        // Sort by createdAt descending
        apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return apps;
      }
      throw err;
    }
  }

  // Update Status
  async updateApplicationStatus(id, updateData) {
    try {
      return await this.fetchWithAuth(`/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn('Backend server is offline. Simulating status update fallback...');
        const mockDb = JSON.parse(localStorage.getItem('easycafe_mock_applications') || '{}');
        const app = mockDb[id];
        if (app) {
          app.status = updateData.status;
          if (updateData.comment !== undefined) {
            app.statusComment = updateData.comment;
          }
          app.updatedAt = new Date().toISOString();
          mockDb[id] = app;
          localStorage.setItem('easycafe_mock_applications', JSON.stringify(mockDb));
          return app;
        }
        throw new Error('Application not found');
      }
      throw err;
    }
  }

  // Get Export CSV Download Link
  getExportCsvUrl() {
    return `${API_BASE_URL}/admin/export/csv?access_token=${this.accessToken}`;
  }
}

// Instantiate globally
window.api = new EasyCafeAPI();
