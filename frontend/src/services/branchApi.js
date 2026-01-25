const API_URL = 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('token');

const branchApi = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get branches error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/branches/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch branch');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get branch error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/branches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create branch');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create branch error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/branches/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update branch');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update branch error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete branch error:', error);
      throw error;
    }
  }
};

export default branchApi;
