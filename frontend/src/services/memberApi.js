const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('token');

const memberApi = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/members`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get members error:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/members/${id}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get member error:', error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create member error:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/members/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update member error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete member error:', error);
      throw error;
    }
  }
};

export default memberApi;
