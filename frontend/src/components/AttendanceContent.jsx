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
  const [people, setPeople] = useState([]); // All members or employees
  const [attendanceRecords, setAttendanceRecords] = useState([]); // All records for the selected month
  const [leavesData, setLeavesData] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Date context
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const { can, isAdmin } = usePermissions();

  // Normalize date to midnight UTC for comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const fetchPeopleAndAttendance = async () => {
    setLoading(true);
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      
      // 1. Fetch the list of all people first
      let peopleList = [];
      if (activeTab === 'member') {
        const res = await memberApi.getAll();
        peopleList = res.members || res.data || [];
      } else {
        const res = await employeeAPI.getAll();
        peopleList = res || [];
      }
      setPeople(peopleList);

      // 2. Fetch attendance, stats, and leaves for the selected time
      const [attendance, currentStats, leaves] = await Promise.all([
        attendanceApi.getAttendance(activeTab, month, year),
        attendanceApi.getAttendanceStats(activeTab, month, year),
        attendanceApi.getLeaves(activeTab)
      ]);
      
      setAttendanceRecords(attendance);
      setStats(currentStats);
      setLeavesData(leaves);
      
      // Reset to first page when tab or date changes
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeopleAndAttendance();
  }, [activeTab, selectedDate]);

  // Combine people list with their attendance status for the selected date
  const combinedList = useMemo(() => {
    const todayTime = normalizeDate(selectedDate);
    
    // Create a lookup for attendance records on today/selected date
    const attendanceLookup = {};
    attendanceRecords.forEach(record => {
      const recordTime = normalizeDate(new Date(record.date));
      if (recordTime === todayTime) {
        attendanceLookup[record.personId?._id || record.personId] = record;
      }
    });

    return people.map(p => ({
      ...p,
      todayAttendance: attendanceLookup[p._id] || null
    }));
  }, [people, attendanceRecords, selectedDate]);

  const filteredList = useMemo(() => {
    return combinedList.filter(item => {
      const name = item.name?.toLowerCase() || '';
      const idCode = (item.memberId || item.employeeCode || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || idCode.includes(searchTerm.toLowerCase());
    });
  }, [combinedList, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredList, currentPage]);

  const handleMarkAttendance = async (personId, status) => {
    try {
      await attendanceApi.markAttendance({
        personId,
        personType: activeTab,
        date: selectedDate,
        status,
        note: `Marked ${status} via dashboard`
      });
      // Refresh only attendance data to show update
      fetchPeopleAndAttendance();
    } catch (error) {
      alert(error.message || 'Failed to mark attendance');
    }
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      await attendanceApi.updateLeaveStatus(leaveId, newStatus);
      fetchPeopleAndAttendance();
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
            {selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <span className="current-time">Manage daily attendance and leaves</span>
        </div>
        
        <div className="header-actions">
          <div className="filter-group">
             <button 
              className="btn-secondary btn-icon"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
              title="Previous Day"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className="btn-secondary btn-icon"
              onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
              title="Next Day"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="btn-primary btn-sm" onClick={() => setIsLeaveModalOpen(true)}>
            <Plus size={18} /> Apply Leave
          </button>
          
          {isAdmin && (
            <button className="btn-secondary btn-sm gym-qr-btn" onClick={() => setIsQrModalOpen(true)}>
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
            <span className="stat-value">{people.length}</span>
            <span className="stat-label">Total {activeTab}s</span>
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
        
        <div className="pagination-info">
          <span>Showing {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, filteredList.length)} of {filteredList.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Member/Emp ID</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading {activeTab}s...</td></tr>
            ) : paginatedList.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No {activeTab}s found matching your search.</td></tr>
            ) : (
              paginatedList.map((person) => (
                <tr key={person._id}>
                  <td>
                    <div className="user-cell">
                      {person.profilePhoto ? (
                        <img src={person.profilePhoto} className="user-avatar" alt="" />
                      ) : (
                        <div className="no-avatar">{person.name?.charAt(0)}</div>
                      )}
                      <div className="user-name-cell">
                        <div style={{ fontWeight: '600' }}>{person.name}</div>
                        {person.todayAttendance?.method === 'qr' && (
                          <span className="method-badge-small"><QrCode size={10} /> QR</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{person.memberId || person.employeeCode || '-'}</td>
                  <td>
                    {person.todayAttendance ? (
                      <span className={`status-badge status-${person.todayAttendance.status}`}>
                        {person.todayAttendance.status}
                      </span>
                    ) : (
                      <span className="status-badge status-pending">Not Marked</span>
                    )}
                  </td>
                  <td>{person.todayAttendance ? formatTime(person.todayAttendance.checkInTime) : '-'}</td>
                  <td>
                    <div className="mark-actions-cell">
                      <button 
                        className={`mark-btn mark-present ${person.todayAttendance?.status === 'present' ? 'active' : ''}`}
                        title="Mark Present"
                        onClick={() => handleMarkAttendance(person._id, 'present')}
                      >
                        P
                      </button>
                      <button 
                        className={`mark-btn mark-absent ${person.todayAttendance?.status === 'absent' ? 'active' : ''}`}
                        title="Mark Absent"
                        onClick={() => handleMarkAttendance(person._id, 'absent')}
                      >
                        A
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="btn-pagination"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="page-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="btn-pagination"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

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
                      <div className="leave-action-btns">
                        <button 
                          className="btn-approve" 
                          onClick={() => handleStatusUpdate(leave._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-reject" 
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
            fetchPeopleAndAttendance();
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
