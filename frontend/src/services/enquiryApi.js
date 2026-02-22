import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

const enquiryApi = {
  async getAll(options = {}) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries`, { signal: options.signal });
      if (!response.ok) throw new Error('Failed to fetch enquiries');
      return await response.json();
    } catch (error) {
      console.error('Get enquiries error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries/${id}`);
      if (!response.ok) throw new Error('Failed to fetch enquiry');
      return await response.json();
    } catch (error) {
      console.error('Get enquiry error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create enquiry');
      return await response.json();
    } catch (error) {
      console.error('Create enquiry error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update enquiry');
      return await response.json();
    } catch (error) {
      console.error('Update enquiry error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete enquiry');
      return await response.json();
    } catch (error) {
      console.error('Delete enquiry error:', error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries/stats/summary`);
      if (!response.ok) throw new Error('Failed to fetch enquiry stats');
      return await response.json();
    } catch (error) {
      console.error('Get enquiry stats error:', error);
      throw error;
    }
  },
};

export default enquiryApi;
