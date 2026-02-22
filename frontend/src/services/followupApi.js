// frontend/src/services/followupApi.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class FollowUpApiService {
  getToken() {
    return localStorage.getItem('token');
  }

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/followups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
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

  async getAll() {
    try {
      const response = await fetch(`${API_URL}/followups`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups');
      }

      return await response.json();
    } catch (error) {
      console.error('Get follow-ups error:', error);
      throw error;
    }
  }

  // ✅ NEW: Get single follow-up by ID
  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/followups/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch follow-up');
      }

      return await response.json();
    } catch (error) {
      console.error('Get follow-up error:', error);
      throw error;
    }
  }

  async getByMember(memberId) {
    try {
      const response = await fetch(`${API_URL}/followups/member/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch member follow-ups');
      }

      return await response.json();
    } catch (error) {
      console.error('Get member follow-ups error:', error);
      throw error;
    }
  }

  async getByEnquiry(enquiryId) {
    try {
      const response = await fetch(`${API_URL}/followups/enquiry/${enquiryId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enquiry follow-ups');
      }

      return await response.json();
    } catch (error) {
      console.error('Get enquiry follow-ups error:', error);
      throw error;
    }
  }

  // ✅ NEW: Full update method (for GenericMaster compatibility)
  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/followups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
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

  // Kept for backwards compatibility
  async updateStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/followups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update follow-up status');
      }

      return await response.json();
    } catch (error) {
      console.error('Update follow-up status error:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/followups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete follow-up');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete follow-up error:', error);
      throw error;
    }
  }

  // ✅ NEW: Get statistics
  async getStats() {
    try {
      const response = await fetch(`${API_URL}/followups/stats`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch follow-up stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get follow-up stats error:', error);
      throw error;
    }
  }

  // ✅ NEW: Auto-expire follow-ups
  async autoExpire() {
    try {
      const response = await fetch(`${API_URL}/followups/auto-expire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to auto-expire follow-ups');
      }

      return await response.json();
    } catch (error) {
      console.error('Auto-expire follow-ups error:', error);
      throw error;
    }
  }
}

export default new FollowUpApiService();
