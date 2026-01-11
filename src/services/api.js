const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.token = localStorage.getItem('token');
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
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.dispatchEvent(new CustomEvent('unauthorized'));
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
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

  async googleLogin(token) {
    return this.request('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/api/auth/me', {
      method: 'GET',
    });
  }

  async createGroup(name, emoji) {
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, emoji }),
    });
  }

  async getGroups() {
    return this.request('/api/groups', {
      method: 'GET',
    });
  }

  async generateInviteLink(groupId) {
    return this.request(`/api/groups/${groupId}/invite`, {
      method: 'POST',
    });
  }

  async sendInviteEmail(groupId, email) {
    return this.request(`/api/invites/${groupId}/email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async joinGroup(token) {
    return this.request('/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getInviteInfo(token) {
    return this.request('/api/invites/info', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async addExpense(groupId, description, amount, splitType, splits, category, paidBy, currency) {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({ groupId, description, amount, splitType, splits, category, paidBy, currency }),
    });
  }

  async getGroupExpenses(groupId) {
    return this.request(`/api/expenses/group/${groupId}`, {
      method: 'GET',
    });
  }

  async detectCategory(description) {
    return this.request('/api/expenses/detect-category', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async deleteExpense(expenseId) {
    return this.request(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  async updateExpense(expenseId, payload) {
    return this.request(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getGroupBalances(groupId) {
    return this.request(`/api/expenses/group/${groupId}/balances`, {
      method: 'GET',
    });
  }

  // In services/api.js
async recordSettlement(groupId, fromUserId, toUserId, amount, note) {
  return this.request(`/api/groups/${groupId}/settlements`, {
    method: 'POST',
    body: JSON.stringify({ from: fromUserId, to: toUserId, amount, note }),
  });
}


  // ✅ FIXED - getGroupSettlements using groups endpoint
  async getGroupSettlements(groupId) {
    return this.request(`/api/groups/${groupId}/settlements`, {
      method: 'GET',
    });
  }

  async sendPaymentReminder(groupId, memberId, amount) {
    return this.request(`/api/groups/${groupId}/remind`, {
      method: 'POST',
      body: JSON.stringify({ groupId, memberId, amount }),
    });
  }

  async updateProfile(formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (formData instanceof FormData) {
      const response = await fetch(`${this.baseURL}/api/profile`, {
        method: 'PUT',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');
      return data;
    }
    
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
  }

  async deleteProfileImage() {
    return this.request('/api/profile/image', {
      method: 'DELETE',
    });
  }

  async getFriends() {
    return this.request('/api/friends', {
      method: 'GET',
    });
  }

  async addFriendsToGroup(groupId, friendIds) {
    return this.request(`/api/groups/${groupId}/add-friends`, {
      method: 'POST',
      body: JSON.stringify({ friendIds }),
    });
  }
}

export default new ApiService();
