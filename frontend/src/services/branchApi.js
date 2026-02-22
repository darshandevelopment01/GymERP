import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

const branchApi = {
  async getAll(options = {}) {
    try {
      const response = await fetchWithAuth(`${API_URL}/branches`, { signal: options.signal });
      if (!response.ok) throw new Error('Failed to fetch branches');
      return await response.json();
    } catch (error) {
      console.error('Get branches error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/branches/${id}`);
      if (!response.ok) throw new Error('Failed to fetch branch');
      return await response.json();
    } catch (error) {
      console.error('Get branch error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/branches`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create branch');
      return await response.json();
    } catch (error) {
      console.error('Create branch error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/branches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update branch');
      return await response.json();
    } catch (error) {
      console.error('Update branch error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/branches/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete branch');
      return await response.json();
    } catch (error) {
      console.error('Delete branch error:', error);
      throw error;
    }
  },
};

export default branchApi;
