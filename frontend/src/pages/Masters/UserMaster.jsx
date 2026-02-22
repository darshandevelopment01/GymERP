import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import { employeeAPI, designationAPI, shiftAPI, branchAPI } from '../../services/mastersApi';


const UserMaster = () => {
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Activity Logs state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ page: 1, totalPages: 1, total: 0 });


  useEffect(() => {
    fetchMasterData();
    checkAdminStatus();
  }, []);


  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setIsAdmin(result.data.userType === 'Admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };


  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/activity-logs?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
        setLogsPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };


  const handleToggleLogs = () => {
    if (!showLogs) {
      fetchLogs(1);
    }
    setShowLogs(!showLogs);
  };


  const getActionIcon = (action) => {
    switch (action) {
      case 'enquiry_created': return '📋';
      case 'enquiry_updated': return '✏️';
      case 'followup_created': return '📞';
      case 'followup_updated': return '🔄';
      case 'member_converted': return '🏋️';
      case 'member_updated': return '👤';
      default: return '📝';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'enquiry_created': return 'Enquiry Created';
      case 'enquiry_updated': return 'Enquiry Updated';
      case 'followup_created': return 'Follow-Up Created';
      case 'followup_updated': return 'Follow-Up Updated';
      case 'member_converted': return 'Member Converted';
      case 'member_updated': return 'Member Updated';
      default: return action;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'enquiry_created': return { bg: '#e3f2fd', color: '#1565c0' };
      case 'enquiry_updated': return { bg: '#e8eaf6', color: '#283593' };
      case 'followup_created': return { bg: '#fff3e0', color: '#e65100' };
      case 'followup_updated': return { bg: '#fff8e1', color: '#f57f17' };
      case 'member_converted': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'member_updated': return { bg: '#f3e5f5', color: '#7b1fa2' };
      default: return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


  const fetchMasterData = async () => {
    try {
      const [designationsRes, shiftsRes, branchesRes] = await Promise.all([
        designationAPI.getAll(),
        shiftAPI.getAll(),
        branchAPI.getAll()
      ]);


      setDesignations(designationsRes.data || []);
      setShifts(shiftsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    { label: 'User Name', field: 'name' },
    // ✅ REMOVED CODE COLUMN
    { label: 'Contact', field: 'phone' },
    {
      label: 'Type',
      field: 'userType',
      render: (item) => (
        <span style={{
          background: item.userType === 'Admin' ? '#e3f2fd' : '#f3e5f5',
          color: item.userType === 'Admin' ? '#1976d2' : '#7b1fa2',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem'
        }}>
          {item.userType}
        </span>
      )
    },
  ];


  const formFields = [
    {
      name: 'profilePhoto',
      label: 'Profile Photo',
      type: 'image-upload',
      required: false,
    },
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: 'Enter phone number',
    },
    {
      name: 'email',
      label: 'Email ID',
      type: 'email',
      required: true,
      placeholder: 'Enter email',
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Gender' },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      name: 'joinDate',
      label: 'Date of Joining',
      type: 'date',
      required: false,
      placeholder: 'dd-mm-yyyy',
    },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Select Designation' },
        ...designations.map(d => ({
          value: d._id,
          label: d.designationName
        }))
      ],
      displayValue: (item) => {
        if (!item.designation) return '-';
        return typeof item.designation === 'object'
          ? item.designation.designationName
          : designations.find(d => d._id === item.designation)?.designationName || item.designation;
      }
    },
    {
      name: 'shift',
      label: 'Shift Timing',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Select Shift Timing' },
        ...shifts.map(s => ({
          value: s._id,
          label: `${s.shiftName} (${s.startTime} - ${s.endTime})`
        }))
      ],
      displayValue: (item) => {
        if (!item.shift) return '-';
        if (typeof item.shift === 'object') {
          return `${item.shift.shiftName} (${item.shift.startTime} - ${item.shift.endTime})`;
        }
        const shift = shifts.find(s => s._id === item.shift);
        return shift ? `${shift.shiftName} (${shift.startTime} - ${shift.endTime})` : item.shift;
      }
    },
    {
      name: 'userType',
      label: 'User Type',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select User Type' },
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
      ],
    },
    {
      name: 'branchId',
      label: 'Branch',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Branch' },
        ...branches.map(b => ({
          value: b._id,
          label: b.name
        }))
      ],
      displayValue: (item) => {
        if (!item.branchId) return '-';
        if (typeof item.branchId === 'object') {
          return item.branchId.name;
        }
        return branches.find(b => b._id === item.branchId)?.name || item.branchId;
      }
    },
    {
      name: 'permissions',
      label: 'User Access Permissions',
      type: 'permission-groups',
      visibleWhen: (formData) => formData.userType === 'User',
      groups: [
        {
          key: 'panelAccess',
          title: 'Panel User Access',
          icon: '🖥️',
          sections: [
            {
              label: 'Masters Tab',
              items: [
                { key: 'viewMastersTab', label: 'View Masters Tab (All Masters)' },
              ]
            },
            {
              label: 'Enquiry Tab',
              items: [
                { key: 'viewEnquiryTab', label: 'View Enquiry Tab' },
                { key: 'createEnquiry', label: 'Create Enquiry' },
                { key: 'convertToMember', label: 'Convert to Member' },
                { key: 'noDiscountLimit', label: 'No Discount Limit' },
                { key: 'viewOnlySelfCreatedEnquiry', label: 'View Only Self-Created Enquiry' },
              ]
            },
            {
              label: 'Members Tab',
              items: [
                { key: 'viewMembersTab', label: 'View Members Tab' },
                { key: 'renewMember', label: 'Renew Member' },
                { key: 'activeMember', label: 'Active Member' },
                { key: 'viewOnlySelfCreatedMembers', label: 'View Only Self-Created Members' },
              ]
            },
            {
              label: 'Attendance Tab',
              items: [
                { key: 'viewAttendanceTab', label: 'View Attendance Tab' },
                { key: 'viewEmployeeAttendance', label: 'View Employee Attendance' },
                { key: 'viewMemberAttendance', label: 'View Member Attendance' },
              ]
            },
          ]
        },
        {
          key: 'appAccess',
          title: 'Application User Access',
          icon: '📱',
          sections: [
            {
              label: 'Enquiry Tab',
              items: [
                { key: 'viewEnquiryTab', label: 'View Enquiry Tab' },
                { key: 'createEnquiry', label: 'Create Enquiry' },
                { key: 'convertToMember', label: 'Convert to Member' },
                { key: 'noDiscountLimit', label: 'No Discount Limit' },
                { key: 'viewOnlySelfCreatedEnquiry', label: 'View Only Self-Created Enquiry' },
                { key: 'markEnquiryAsLost', label: 'Mark Enquiry as Lost' },
              ]
            },
            {
              label: 'Follow-Up Tab',
              items: [
                { key: 'viewFollowUpTab', label: 'View Follow-Up Tab' },
                { key: 'addFollowUps', label: 'Add Follow-Ups' },
                { key: 'viewOnlySelfCreatedFollowUps', label: 'View Only Self-Created Follow-Ups' },
              ]
            },
            {
              label: 'Members Tab',
              items: [
                { key: 'viewMembersTab', label: 'View Members Tab' },
                { key: 'renewMember', label: 'Renew Member' },
                { key: 'activeMember', label: 'Active Member' },
                { key: 'viewOnlySelfCreatedMembers', label: 'View Only Self-Created Members' },
              ]
            },
            {
              label: 'Offers',
              items: [
                { key: 'createRemoveOffers', label: 'Create & Remove Offers' },
              ]
            },
          ]
        },
      ]
    },
  ];


  const [activeTab, setActiveTab] = useState('users');

  // Auto-fetch logs when switching to logs tab
  useEffect(() => {
    if (activeTab === 'logs' && isAdmin && logs.length === 0) {
      fetchLogs(1);
    }
  }, [activeTab]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }


  return (
    <div className="user-master-page">
      {/* Tab Bar - only show if admin */}
      {isAdmin && (
        <div style={{
          display: 'flex',
          gap: '0',
          margin: '0 1.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '-1px',
          position: 'relative',
          zIndex: 1
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'users' ? 600 : 400,
              color: activeTab === 'users' ? '#6366f1' : '#64748b',
              borderBottom: activeTab === 'users' ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            👤 Users
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '0.85rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'logs' ? 600 : 400,
              color: activeTab === 'logs' ? '#6366f1' : '#64748b',
              borderBottom: activeTab === 'logs' ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📋 Activity Logs
          </button>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <GenericMaster
          title="User Master"
          apiService={employeeAPI}
          columns={columns}
          formFields={formFields}
          searchPlaceholder="Search users..."
          icon="👤"
        />
      )}

      {/* Activity Logs Tab - Admin Only */}
      {activeTab === 'logs' && isAdmin && (
        <div style={{ padding: '1.5rem' }}>
          {/* Logs Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e' }}>
                📋 Activity Logs
              </h2>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Track all enquiry, follow-up, and member conversion activities
              </p>
            </div>
            <button
              onClick={() => fetchLogs(logsPagination.page)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Logs Content */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            {logsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                Loading activity logs...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No activity logs yet</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  Logs will appear when enquiries are created, follow-ups are added, or members are converted.
                </p>
              </div>
            ) : (
              <>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e9ecef' }}>
                      <th style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                      <th style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Performed By</th>
                      <th style={{ textAlign: 'left', padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => {
                      const actionStyle = getActionColor(log.action);
                      return (
                        <tr key={log._id} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: index % 2 === 0 ? '#fff' : '#fafbfc'
                        }}>
                          <td style={{ padding: '0.85rem 1rem', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                            {formatDate(log.createdAt)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: actionStyle.bg,
                              color: actionStyle.color,
                              padding: '0.35rem 0.8rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 500
                            }}>
                              {getActionIcon(log.action)} {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: '#334155' }}>
                            {log.performedByName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid #e9ecef',
                  background: '#f8fafc'
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Showing {((logsPagination.page - 1) * 20) + 1}–{Math.min(logsPagination.page * 20, logsPagination.total)} of {logsPagination.total} logs
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => fetchLogs(logsPagination.page - 1)}
                      disabled={logsPagination.page <= 1}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: logsPagination.page <= 1 ? '#f8fafc' : '#fff',
                        cursor: logsPagination.page <= 1 ? 'not-allowed' : 'pointer',
                        color: logsPagination.page <= 1 ? '#cbd5e1' : '#475569',
                        fontSize: '0.85rem'
                      }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                      Page {logsPagination.page} of {logsPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchLogs(logsPagination.page + 1)}
                      disabled={logsPagination.page >= logsPagination.totalPages}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: logsPagination.page >= logsPagination.totalPages ? '#f8fafc' : '#fff',
                        cursor: logsPagination.page >= logsPagination.totalPages ? 'not-allowed' : 'pointer',
                        color: logsPagination.page >= logsPagination.totalPages ? '#cbd5e1' : '#475569',
                        fontSize: '0.85rem'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default UserMaster;
