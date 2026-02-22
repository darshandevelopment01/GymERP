// frontend/src/services/followupApi.js
import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

class FollowUpApiService {
  async create(data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create follow-up');
      }
      return await response.json();
    } catch (error) {
      console.error('Create follow-up error:', error);
      throw error;
    }
  }

  async getAll(options = {}) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups`, { signal: options.signal });
      if (!response.ok) throw new Error('Failed to fetch follow-ups');
      return await response.json();
    } catch (error) {
      console.error('Get follow-ups error:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/${id}`);
      if (!response.ok) throw new Error('Failed to fetch follow-up');
      return await response.json();
    } catch (error) {
      console.error('Get follow-up error:', error);
      throw error;
    }
  }

  async getByMember(memberId) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/member/${memberId}`);
      if (!response.ok) throw new Error('Failed to fetch member follow-ups');
      return await response.json();
    } catch (error) {
      console.error('Get member follow-ups error:', error);
      throw error;
    }
  }

  async getByEnquiry(enquiryId) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/enquiry/${enquiryId}`);
      if (!response.ok) throw new Error('Failed to fetch enquiry follow-ups');
      return await response.json();
    } catch (error) {
      console.error('Get enquiry follow-ups error:', error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update follow-up');
      }
      return await response.json();
    } catch (error) {
      console.error('Update follow-up error:', error);
      throw error;
    }
  }

  async updateStatus(id, status) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update follow-up status');
      return await response.json();
    } catch (error) {
      console.error('Update follow-up status error:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete follow-up');
      return await response.json();
    } catch (error) {
      console.error('Delete follow-up error:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/stats`);
      if (!response.ok) throw new Error('Failed to fetch follow-up stats');
      return await response.json();
    } catch (error) {
      console.error('Get follow-up stats error:', error);
      throw error;
    }
  }

  async autoExpire() {
    try {
      const response = await fetchWithAuth(`${API_URL}/followups/auto-expire`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to auto-expire follow-ups');
      return await response.json();
    } catch (error) {
      console.error('Auto-expire follow-ups error:', error);
      throw error;
    }
  }
}

export default new FollowUpApiService();
