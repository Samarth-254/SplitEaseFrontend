const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('token');
    this.requestTimeout = 30000; // 30 seconds
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // ✅ Helper to check if error is from notifications
  isNotificationError(endpoint) {
    const notificationEndpoints = [
      '/notifications',
      '/subscribe',
      '/unsubscribe',
      '/push'
    ];
    return notificationEndpoints.some(path => endpoint.includes(path));
  }

  // ✅ Request with timeout
  async fetchWithTimeout(url, options, timeout = this.requestTimeout) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      }
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, config);
      
      // ✅ Handle empty responses (204 No Content, etc)
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (response.status === 204) {
        data = { success: true };
      } else {
        data = { message: 'Success' };
      }

      if (!response.ok) {
        if (response.status === 401) {
          // ✅ Don't logout for notification errors
          if (this.isNotificationError(endpoint)) {
            console.warn('⚠️ Notification error (non-critical):', data.message);
            throw new Error(data.message || 'Notification error');
          }
          
          // Logout for real auth failures
          console.error('❌ Authentication failed, logging out');
          this.clearToken();
          window.dispatchEvent(new CustomEvent('unauthorized'));
        }
        
        // ✅ Better error messages
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // ✅ Network error handling
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error - please check your internet connection');
      }
      
      // ✅ Log non-critical notification errors
      if (this.isNotificationError(endpoint)) {
        console.warn('Notification request failed (non-critical):', error.message);
      }
      
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // ✅ Better file upload handling
  async uploadFile(endpoint, formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error - please check your internet connection');
      }
      throw error;
    }
  }

  // Auth
  async googleLogin(token) {
    return this.post('/api/auth/google-login', { token });
  }

  async login(email, password) {
    return this.post('/api/auth/login', { email, password });
  }

  async register(name, email, password) {
    return this.post('/api/auth/register', { name, email, password });
  }

  async getMe() {
    return this.get('/api/auth/me');
  }

  // Groups
  async createGroup(name, emoji) {
    return this.post('/api/groups', { name, emoji });
  }

  async updateGroup(groupId, updates) {
    return this.put(`/api/groups/${groupId}`, updates);
  }

  async getGroups() {
    return this.get('/api/groups');
  }

  async generateInviteLink(groupId) {
    return this.post(`/api/groups/${groupId}/invite`);
  }

  async sendInviteEmail(groupId, email) {
    return this.post(`/api/invites/${groupId}/email`, { email });
  }

  async joinGroup(token) {
    return this.post('/api/groups/join', { token });
  }

  async getInviteInfo(token) {
    return this.post('/api/invites/info', { token });
  }

  async addFriendsToGroup(groupId, friendIds) {
    return this.post(`/api/groups/${groupId}/add-friends`, { friendIds });
  }

  // Expenses
  async addExpense(groupId, description, amount, splitType, splits, category, paidBy, currency) {
    return this.post('/api/expenses', { 
      groupId, 
      description, 
      amount, 
      splitType, 
      splits, 
      category, 
      paidBy, 
      currency 
    });
  }

  async getGroupExpenses(groupId) {
    return this.get(`/api/expenses/group/${groupId}`);
  }

  async detectCategory(description) {
    return this.post('/api/expenses/detect-category', { description });
  }

  async deleteExpense(expenseId) {
    return this.delete(`/api/expenses/${expenseId}`);
  }

  async updateExpense(expenseId, payload) {
    return this.put(`/api/expenses/${expenseId}`, payload);
  }

  async getGroupBalances(groupId) {
    return this.get(`/api/expenses/group/${groupId}/balances`);
  }

  // Settlements
  async recordSettlement(groupId, fromUserId, toUserId, amount, note) {
    return this.post(`/api/groups/${groupId}/settlements`, { 
      from: fromUserId, 
      to: toUserId, 
      amount, 
      note 
    });
  }

  async getGroupSettlements(groupId) {
    return this.get(`/api/groups/${groupId}/settlements`);
  }

  async sendPaymentReminder(groupId, memberId, amount) {
    return this.post(`/api/groups/${groupId}/remind`, { groupId, memberId, amount });
  }

  async sendCombinedReminder(memberId, totalAmount, groupBreakdown) {
    return this.post('/api/groups/remind/combined', { 
      memberId, 
      totalAmount, 
      groupBreakdown 
    });
  }

  // Profile
  async updateProfile(formData) {
    if (formData instanceof FormData) {
      return this.uploadFile('/api/profile', formData);
    }
    return this.put('/api/profile', formData);
  }

  async deleteProfileImage() {
    return this.delete('/api/profile/image');
  }

  // Friends
  async getFriends() {
    return this.get('/api/friends');
  }
}

export default new ApiService();
