// frontend/src/components/AttendanceContent.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Search, 
  Plus, 
  QrCode, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import attendanceApi from '../services/attendanceApi';
import memberApi from '../services/memberApi';
import { employeeAPI } from '../services/mastersApi';
import { usePermissions } from '../hooks/usePermissions';
import LeaveModal from './LeaveModal';
import QRDisplayModal from './QRDisplayModal';
import './AttendanceContent.css';

const AttendanceContent = () => {
  const [activeTab, setActiveTab] = useState('member');
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date context
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const { can, isAdmin } = usePermissions();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      
      const [attendance, currentStats, leaves] = await Promise.all([
        attendanceApi.getAttendance(activeTab, month, year),
        attendanceApi.getAttendanceStats(activeTab, month, year),
        attendanceApi.getLeaves(activeTab)
      ]);
      
      setAttendanceData(attendance);
      setStats(currentStats);
      setLeavesData(leaves);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeTab, selectedDate]);

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter(item => {
      const name = item.personId?.name?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase());
    });
  }, [attendanceData, searchTerm]);

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      await attendanceApi.updateLeaveStatus(leaveId, newStatus);
      fetchAllData(); // Refresh
    } catch (error) {
      alert('Failed to update leave status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="attendance-container">
      {/* Header */}
      <div className="attendance-header">
        <div className="date-display">
          <span className="current-date">
            {selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <span className="current-time">Manage daily attendance and leaves</span>
        </div>
        
        <div className="header-actions">
          <div className="filter-group">
             <button 
              className="btn-secondary"
              onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <button className="btn-primary" onClick={() => setIsLeaveModalOpen(true)}>
            <Plus size={18} /> Apply Leave / Mark
          </button>
          
          {isAdmin && (
            <button className="btn-secondary" onClick={() => setIsQrModalOpen(true)}>
              <QrCode size={18} /> Gym QR
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="attendance-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.present}</span>
            <span className="stat-label">Present</span>
          </div>
        </div>
        
        <div className="attendance-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <UserX size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.absent}</span>
            <span className="stat-label">Absent</span>
          </div>
        </div>
        
        <div className="attendance-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.leave}</span>
            <span className="stat-label">On Leave</span>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{filteredAttendance.length}</span>
            <span className="stat-label">Total Records</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="attendance-tabs">
        <button 
          className={`attendance-tab-btn ${activeTab === 'member' ? 'active' : ''}`}
          onClick={() => setActiveTab('member')}
        >
          Members
        </button>
        <button 
          className={`attendance-tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee')}
        >
          Employees
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}s...`}
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          {/* Add more filters if needed */}
        </div>
      </div>

      {/* Table */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Date</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Method</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</td></tr>
            ) : filteredAttendance.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No records found for this period.</td></tr>
            ) : (
              filteredAttendance.map((record) => (
                <tr key={record._id}>
                  <td>
                    <div className="user-cell">
                      {record.personId?.profilePhoto ? (
                        <img src={record.personId.profilePhoto} className="user-avatar" alt="" />
                      ) : (
                        <div className="no-avatar">{record.personId?.name?.charAt(0)}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: '600' }}>{record.personId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {record.personId?.memberId || record.personId?.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(record.date)}</td>
                  <td>
                    <span className={`status-badge status-${record.status}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{formatTime(record.checkInTime)}</td>
                  <td>
                    <span className="method-badge">
                      {record.method === 'qr' ? <QrCode size={12} /> : <Clock size={12} />}
                      {record.method}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: '0.75rem', color: '#64748b' }}>
                    {record.note || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending Leaves Section (If Admin) */}
      {isAdmin && leavesData.some(l => l.status === 'pending') && (
        <div className="pending-leaves-section" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} color="#f59e0b" /> Pending Leave Approvals
          </h3>
          <div className="attendance-table-container">
            <table className="attendance-table">
               <thead>
                <tr>
                  <th>Person</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Applied By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leavesData.filter(l => l.status === 'pending').map(leave => (
                  <tr key={leave._id}>
                    <td>{leave.personId?.name}</td>
                    <td>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                    <td>{leave.reason}</td>
                    <td>{leave.appliedBy?.name}</td>
                    <td>
                      <div className="filter-group">
                        <button 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleStatusUpdate(leave._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626' }}
                          onClick={() => handleStatusUpdate(leave._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isLeaveModalOpen && (
        <LeaveModal 
          onClose={() => setIsLeaveModalOpen(false)} 
          onSuccess={() => {
            setIsLeaveModalOpen(false);
            fetchAllData();
          }} 
        />
      )}
      
      {isQrModalOpen && (
        <QRDisplayModal 
          onClose={() => setIsQrModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default AttendanceContent;
