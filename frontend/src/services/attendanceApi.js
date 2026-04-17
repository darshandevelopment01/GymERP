// frontend/src/services/attendanceApi.js
import fetchWithAuth from './fetchWithAuth';

const API_URL = import.meta.env.VITE_API_URL;

class AttendanceApi {
  async getAttendance(type, month, year) {
    const response = await fetchWithAuth(
      `${API_URL}/attendance?type=${type}&month=${month}&year=${year}`
    );
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return response.json();
  }

  async markAttendance(data) {
    const response = await fetchWithAuth(`${API_URL}/attendance/mark`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark attendance');
    }
    return response.json();
  }

  async getAttendanceStats(type, month, year) {
    const response = await fetchWithAuth(
      `${API_URL}/attendance/stats?type=${type}&month=${month}&year=${year}`
    );
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async applyLeave(data) {
    const response = await fetchWithAuth(`${API_URL}/attendance/leave`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to apply leave');
    return response.json();
  }

  async getLeaves(type) {
    const response = await fetchWithAuth(`${API_URL}/attendance/leaves?type=${type}`);
    if (!response.ok) throw new Error('Failed to fetch leaves');
    return response.json();
  }

  async getMyLeaves() {
    const response = await fetchWithAuth(`${API_URL}/attendance/my-leaves`);
    if (!response.ok) throw new Error('Failed to fetch your leaves');
    return response.json();
  }

  async updateLeaveStatus(id, status, rejectionReason = '') {
    const response = await fetchWithAuth(`${API_URL}/attendance/leave/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    if (!response.ok) throw new Error('Failed to update leave status');
    return response.json();
  }

  async getGymQr() {
    const response = await fetchWithAuth(`${API_URL}/attendance/gym-qr`);
    if (!response.ok) throw new Error('Failed to fetch gym QR');
    return response.json();
  }
}

export default new AttendanceApi();
