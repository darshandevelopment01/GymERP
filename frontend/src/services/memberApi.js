import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

const memberApi = {
  async getAll(options = {}) {
    try {
      const response = await fetchWithAuth(`${API_URL}/members`, { signal: options.signal });
      if (!response.ok) throw new Error('Failed to fetch members');
      return await response.json();
    } catch (error) {
      console.error('Get members error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/members/${id}`);
      if (!response.ok) throw new Error('Failed to fetch member');
      return await response.json();
    } catch (error) {
      console.error('Get member error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create member');
      return await response.json();
    } catch (error) {
      console.error('Create member error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update member');
      return await response.json();
    } catch (error) {
      console.error('Update member error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/members/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete member');
      return await response.json();
    } catch (error) {
      console.error('Delete member error:', error);
      throw error;
    }
  },
};

export default memberApi;
