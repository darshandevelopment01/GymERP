// src/services/api.js
const API_URL = 'https://muscletime-backend-git-main-dev-teams-projects-f902652e.vercel.app/api';

class ApiService {
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async getDashboardStats() {
    try {
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }

  // NEW: Get weekly attendance
  async getWeeklyAttendance() {
    try {
      const response = await fetch(`${API_URL}/dashboard/attendance-weekly`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Attendance error:', error);
      throw error;
    }
  }

  // NEW: Get membership growth
  async getMembershipGrowth() {
    try {
      const response = await fetch(`${API_URL}/dashboard/membership-growth`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch growth data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Growth data error:', error);
      throw error;
    }
  }

  async getMembers(page = 1, limit = 10) {
    const response = await fetch(`${API_URL}/members?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  }

  async createMember(memberData) {
    const response = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) throw new Error('Failed to create member');
    return response.json();
  }
}

export default new ApiService();
