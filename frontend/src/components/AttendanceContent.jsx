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
  AlertCircle,
  Download,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import attendanceApi from '../services/attendanceApi';
import memberApi from '../services/memberApi';
import { employeeAPI } from '../services/mastersApi';
import { usePermissions } from '../hooks/usePermissions';
import LeaveModal from './LeaveModal';
import QRDisplayModal from './QRDisplayModal';
import './AttendanceContent.css';

const AttendanceContent = () => {
  const [activeTab, setActiveTab] = useState('member'); // 'member', 'employee', 'leaves'
  const [people, setPeople] = useState([]); // All members or employees
  const [attendanceRecords, setAttendanceRecords] = useState([]); // All records for the selected month
  const [leavesData, setLeavesData] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
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
      if (activeTab === 'member' || activeTab === 'employee') {
        if (activeTab === 'member') {
          const res = await memberApi.getAll();
          peopleList = res.members || res.data || [];
        } else {
          const res = await employeeAPI.getAll();
          peopleList = Array.isArray(res) ? res : (res.data || []);
        }
        setPeople(peopleList);
      }

      // 2. Fetch attendance, stats, and leaves for the selected time
      const fetchType = activeTab === 'leaves' ? 'employee' : activeTab;
      const [attendance, currentStats, leaves] = await Promise.all([
        attendanceApi.getAttendance(fetchType, month, year),
        attendanceApi.getAttendanceStats(fetchType, month, year),
        attendanceApi.getLeaves(fetchType)
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
    let list = combinedList;

    // Filter by Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(item => {
        const name = item.name?.toLowerCase() || '';
        const idCode = (item.memberId || item.employeeCode || '').toLowerCase();
        return name.includes(term) || idCode.includes(term);
      });
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      list = list.filter(item => {
        const status = item.todayAttendance?.status || 'pending';
        if (statusFilter === 'pending') return status === 'pending';
        return status === statusFilter;
      });
    }

    // Filter by Date Range (if set)
    if (startDateFilter && endDateFilter) {
      const start = new Date(startDateFilter).getTime();
      const end = new Date(endDateFilter).getTime();
      // Since 'combinedList' is keyed to 'selectedDate', date range filtering 
      // is actually more about the attendance records we fetch.
      // For now, we'll keep it simple: if date range is set, we use it for the table's context.
    }

    return list;
  }, [combinedList, searchTerm, statusFilter, startDateFilter, endDateFilter]);

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
      fetchPeopleAndAttendance();
    } catch (error) {
      alert(error.message || 'Failed to mark attendance');
    }
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      if (!window.confirm(`Are you sure you want to ${newStatus} this leave?`)) return;
      await attendanceApi.updateLeaveStatus(leaveId, newStatus);
      fetchPeopleAndAttendance();
    } catch (error) {
      alert('Failed to update leave status');
    }
  };

  const handleExport = () => {
    const exportData = filteredList.map(item => ({
      'Name': item.name,
      'ID/Code': item.memberId || item.employeeCode || '-',
      'Status': item.todayAttendance?.status || 'Not Marked',
      'Date': selectedDate.toLocaleDateString('en-IN'),
      'Check-in Time': item.todayAttendance?.checkInTime ? new Date(item.todayAttendance.checkInTime).toLocaleTimeString() : '-',
      'Marked By': item.todayAttendance?.markedBy?.name || '-',
      'Method': item.todayAttendance?.method || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Export_${selectedDate.toISOString().split('T')[0]}.xlsx`);
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
          <span className="current-time">Manage attendance, filters, and exports</span>
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

          <button className="btn-secondary btn-sm" onClick={handleExport}>
            <Download size={18} /> Export Excel
          </button>
          
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
        {isAdmin && (
          <button 
            className={`attendance-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            Leave Requests
          </button>
        )}
      </div>

      {activeTab !== 'leaves' ? (
        <>
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

          {/* Advanced Toolbar */}
          <div className="toolbar advanced-toolbar">
            <div className="toolbar-main">
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
              
              <div className="filter-select-wrapper">
                <Filter size={16} />
                <select 
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                  <option value="pending">Not Marked</option>
                </select>
              </div>
            </div>

            <div className="toolbar-secondary">
              <div className="date-range-inputs">
                <input 
                  type="date" 
                  className="toolbar-date-input"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  placeholder="Start"
                />
                <span>-</span>
                <input 
                  type="date" 
                  className="toolbar-date-input"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  placeholder="End"
                />
              </div>
              <div className="pagination-info">
                Showing {filteredList.length} {activeTab}s
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>ID/Code</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</td></tr>
                ) : paginatedList.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No records found matching filters.</td></tr>
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
        </>
      ) : (
        /* Leave Requests Admin Tab */
        <div className="leave-management-view">
          <div className="toolbar">
            <div className="search-input-wrapper">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search leaves by name..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={20} color="#f59e0b" />
              <span style={{ fontWeight: 600 }}>Review employee leave applications</span>
            </div>
          </div>

          <div className="attendance-table-container">
            <table className="attendance-table">
               <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dates (Start - End)</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading leaves...</td></tr>
                ) : leavesData.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No leave applications found.</td></tr>
                ) : (
                  leavesData.filter(l => l.personId?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(leave => (
                    <tr key={leave._id}>
                      <td style={{ fontWeight: 600 }}>{leave.personId?.name || 'Unknown'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} color="#64748b" />
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={leave.reason}>
                          {leave.reason}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${leave.status}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>{leave.appliedBy?.name || 'Self'}</td>
                      <td>
                        {leave.status === 'pending' ? (
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
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed by {leave.handledBy?.name || 'Admin'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
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
