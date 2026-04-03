import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

const enquiryApi = {
  async getAll(options = {}) {
    try {
      let url = `${API_URL}/enquiries`;
      // Auto-detect selfOnly from user permissions in localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = user.userType === 'Admin' || user.userType === 'admin' || user.userType === 'gym_owner';
      const viewOnlySelf = user?.permissions?.panelAccess?.viewOnlySelfCreatedEnquiry;
      if (!isAdmin && viewOnlySelf) {
        url += '?selfOnly=true';
      }
      const response = await fetchWithAuth(url, { signal: options.signal });
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

      const result = await response.json();
      if (!response.ok) {
        // Attach the status and full result to the error so caller can handle conflicts
        const error = new Error(result.message || 'Failed to create enquiry');
        error.status = response.status;
        error.data = result;
        throw error;
      }
      return result;
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

      const result = await response.json();
      if (!response.ok) {
        const error = new Error(result.message || 'Failed to update enquiry');
        error.status = response.status;
        error.data = result;
        throw error;
      }
      return result;
    } catch (error) {
      console.error('Update enquiry error:', error);
      throw error;
    }
  },

  async reopen(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/enquiries/${id}/reopen`, {
        method: 'PUT',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reopen enquiry');
      }
      return result;
    } catch (error) {
      console.error('Reopen enquiry error:', error);
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
