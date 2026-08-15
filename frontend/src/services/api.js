const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const request = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const err = await response.json();
      message = err.detail || err.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};

const uploadRequest = async (path, formData) => {
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!response.ok) {
    let message = `Upload failed: ${response.status}`;
    try {
      const err = await response.json();
      message = err.detail || err.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
};

export const authAPI = {
  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { access_token: data.access_token, user: null };
  },

  async getCurrentUser() {
    try {
      return await request('/api/auth/me');
    } catch {
      return null;
    }
  },

  async logout() {
    // Stateless JWT - nothing to do server-side
  },

  async changePassword(oldPassword, newPassword) {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },
};

export const categoriesAPI = {
  async getAll() {
    return request('/api/categories');
  },

  async create(category) {
    return request('/api/categories', { method: 'POST', body: JSON.stringify(category) });
  },

  async update(id, category) {
    return request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) });
  },

  async delete(id) {
    return request(`/api/categories/${id}`, { method: 'DELETE' });
  },
};

export const itemsAPI = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.search) query.set('search', params.search);
    if (params.low_stock) query.set('low_stock', 'true');
    const qs = query.toString();
    return request(`/api/items${qs ? `?${qs}` : ''}`);
  },

  async getByCategory(categoryId) {
    return request(`/api/items?category_id=${categoryId}`);
  },

  async create(item) {
    return request('/api/items', { method: 'POST', body: JSON.stringify(item) });
  },

  async update(id, item) {
    return request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(item) });
  },

  async delete(id) {
    return request(`/api/items/${id}`, { method: 'DELETE' });
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const data = await uploadRequest('/api/uploads/image', formData);
    return data;
  },

  getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  },
};

export const stockAPI = {
  async getMovements(filters = {}) {
    const query = new URLSearchParams();
    if (filters.type) query.set('movement_type', filters.type);
    if (filters.item_id) query.set('item_id', filters.item_id);
    const qs = query.toString();
    return request(`/api/stock/movements${qs ? `?${qs}` : ''}`);
  },

  async stockIn(data) {
    return request('/api/stock/in', { method: 'POST', body: JSON.stringify(data) });
  },

  async stockOut(data) {
    return request('/api/stock/out', { method: 'POST', body: JSON.stringify(data) });
  },

  async adjust(data) {
    return request('/api/stock/adjust', { method: 'POST', body: JSON.stringify(data) });
  },
};

export const salesAPI = {
  async getAll() {
    return request('/api/sales?limit=100');
  },

  async create(saleData) {
    return request('/api/sales', { method: 'POST', body: JSON.stringify(saleData) });
  },

  async getById(id) {
    return request(`/api/sales/${id}`);
  },
};

export const dashboardAPI = {
  async getStats() {
    return request('/api/dashboard/stats');
  },

  async getAdminStats() {
    return request('/api/dashboard/stats');
  },

  async getRecentSales(limit = 5) {
    return request(`/api/dashboard/recent-sales?limit=${limit}`);
  },

  async getLowStock(limit = 5) {
    return request(`/api/dashboard/low-stock?limit=${limit}`);
  },

  async getUsersStats() {
    const stats = await request('/api/dashboard/stats');
    return {
      total_users: stats.total_users || 0,
      active_users: stats.active_users || 0,
      top_items: [],
    };
  },
};

export const usersAPI = {
  async getAll() {
    return request('/api/auth/users');
  },

  async create(userData) {
    return request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  },

  async update(id, userData) {
    return request(`/api/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
  },

  async delete(id) {
    return request(`/api/auth/users/${id}`, { method: 'DELETE' });
  },
};

export const analyticsAPI = {
  async getSalesByCategory() {
    return request('/api/analytics/sales-by-category');
  },
};

export const debtsAPI = {
  async getAll(filters = {}) {
    const query = new URLSearchParams();
    if (filters.type) query.set('type', filters.type);
    if (filters.status) query.set('status', filters.status);
    const qs = query.toString();
    return request(`/api/debts${qs ? `?${qs}` : ''}`);
  },

  async create(debtData) {
    return request('/api/debts', { method: 'POST', body: JSON.stringify(debtData) });
  },

  async recordPayment(id, paymentAmount) {
    return request(`/api/debts/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount: paymentAmount }),
    });
  },

  async delete(id) {
    return request(`/api/debts/${id}`, { method: 'DELETE' });
  },
};

export const poll = (callback, intervalMs = 15000) => {
  const timer = setInterval(() => {
    callback();
  }, intervalMs);
  return () => clearInterval(timer);
};

export default { API_URL, setAuthToken, getAuthToken };