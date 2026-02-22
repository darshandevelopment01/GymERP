const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;

const getToken = () => localStorage.getItem('token');

const planApi = {
  async getAll(options = {}) {
    try {
      const response = await fetch(`${API_URL}/masters/plans`, {  // Using /masters/plans
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/masters/plans/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Get plan error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/masters/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Create plan error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/masters/plans/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Update plan error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/masters/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete plan error:', error);
      throw error;
    }
  }
};

export default planApi;
