import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import followupApi from '../../services/followupApi';
import './FollowUpMaster.css';

const FollowUpMaster = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    expired: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // View Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Refresh key to trigger GenericMaster re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchFollowUps();
      // Check if user is admin
      try {
        const token = localStorage.getItem('token');
        const meRes = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (meData.data?.userType === 'Admin') setIsAdmin(true);
      } catch (e) { console.error('Admin check failed:', e); }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const response = await followupApi.getAll();

      if (response.success && response.data) {
        const data = response.data;

        // Auto-update expired follow-ups
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const updatedData = data.map(followup => {
          if (followup.followUpDate && followup.status === 'pending') {
            const followUpDate = new Date(followup.followUpDate);
            followUpDate.setHours(0, 0, 0, 0);

            if (followUpDate < today) {
              followupApi.update(followup._id, { status: 'expired' }).catch(console.error);
              return { ...followup, status: 'expired' };
            }
          }
          return followup;
        });

        // Calculate stats
        setStats({
          total: updatedData.length,
          pending: updatedData.filter(f => f.status === 'pending').length,
          completed: updatedData.filter(f => f.status === 'completed').length,
          expired: updatedData.filter(f => f.status === 'expired').length
        });
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      setStats({ total: 0, pending: 0, completed: 0, expired: 0 });
    }
  };

  const handleStatusChange = async (followupId, newStatus) => {
    try {
      await followupApi.update(followupId, { status: newStatus });
      alert(`✅ Status updated to ${newStatus}!`);
      setRefreshKey(prev => prev + 1);
      fetchFollowUps();

      if (selectedFollowUp && selectedFollowUp._id === followupId) {
        setSelectedFollowUp({ ...selectedFollowUp, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('❌ Failed to update status. Please try again.');
    }
  };

  // ✅ Custom row click handler
  const handleRowClick = (followup) => {
    console.log('🔍 Opening details modal for:', followup);
    setSelectedFollowUp(followup);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedFollowUp(null);
  };

  // ✅ Handle Edit - Open edit form
  const handleEditFollowUp = (followup) => {
    setEditFormData({
      note: followup.note || '',
      followUpDate: followup.followUpDate ? new Date(followup.followUpDate).toISOString().split('T')[0] : '',
      followUpTime: followup.followUpTime || '',
      status: followup.status || 'pending'
    });
    setSelectedFollowUp(followup);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  // ✅ Handle Edit Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        note: editFormData.note,
        followUpDate: editFormData.followUpDate,
        followUpTime: editFormData.followUpTime,
        status: editFormData.status
      };

      await followupApi.update(selectedFollowUp._id, updateData);
      alert('✅ Follow-up updated successfully!');

      setShowEditModal(false);
      setSelectedFollowUp(null);
      setEditFormData({});
      setRefreshKey(prev => prev + 1);
      fetchFollowUps();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      alert('❌ Failed to update follow-up. Please try again.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const columns = [
    {
      label: 'Type',
      field: 'type',
      render: (item) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: item.member ? '#dbeafe' : '#dcfce7',
          color: item.member ? '#1e40af' : '#15803d'
        }}>
          {item.member ? '👤 Member' : '📋 Enquiry'}
        </span>
      )
    },
    {
      label: 'Name',
      field: 'name',
      render: (item) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1e293b' }}>
            {item.member?.name || item.enquiry?.name || '-'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {item.member ? `ID: ${item.member.memberId}` : `ID: ${item.enquiry?.enquiryId || '-'}`}
          </div>
        </div>
      )
    },
    {
      label: 'Note',
      field: 'note',
      render: (item) => (
        <div style={{
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.9rem'
        }}>
          {item.note}
        </div>
      )
    },
    {
      label: 'Follow-up Date',
      field: 'followUpDate',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
            {formatDate(item.followUpDate)}
          </div>
          {item.followUpTime && (
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              🕐 {formatTime(item.followUpTime)}
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Created Date',
      field: 'createdAt',
      render: (item) => (
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {formatDate(item.createdAt)}
        </span>
      )
    },
    {
      label: 'Status',
      field: 'status',
      render: (item) => (
        <span
          style={{
            background: getStatusBadgeColor(item.status),
            color: 'white',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}
        >
          {item.status}
        </span>
      )
    },
    // Created By column - admin only
    ...(isAdmin ? [{
      label: 'Created By',
      field: 'createdBy',
      render: (item) => (
        <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>
          {item.createdBy?.name || '-'}
        </span>
      )
    }] : [])
  ];

  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'expired', label: 'Expired' }
      ]
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: '', label: 'All Types' },
        { value: 'member', label: 'Member' },
        { value: 'enquiry', label: 'Enquiry' }
      ]
    },
    {
      name: 'startDate',
      label: 'From Date',
      type: 'date'
    },
    {
      name: 'endDate',
      label: 'To Date',
      type: 'date'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Follow-ups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button onClick={fetchInitialData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="followup-master-page">
        <div className="stats-container">
          <div className="stat-card total">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Follow-ups</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card expired">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats.expired}</h3>
              <p>Expired</p>
            </div>
          </div>
        </div>

        <GenericMaster
          title="Follow-ups Management"
          apiService={followupApi}
          columns={columns}
          formFields={[]}
          filterConfig={filterConfig}
          searchPlaceholder="Search by name, note..."
          icon="📝"
          showCreateButton={false}
          showExportButton={true}
          exportFileName="followups"
          onRowClick={handleRowClick}
          showEditDeleteButtons={false}
          refreshKey={refreshKey}
          customActions={(item) => (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* ✅ Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditFollowUp(item);
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ✏️ Edit
              </button>

              {item.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(item._id, 'completed');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  ✅ Complete
                </button>
              )}
              {item.status === 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(item._id, 'pending');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  ⏳ Reopen
                </button>
              )}
            </div>
          )}
        />
      </div>

      {/* CUSTOM VIEW DETAILS MODAL */}
      {showDetailsModal && selectedFollowUp && (
        <div
          className="modal-overlay"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
                👁️ Follow-up Details
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              {/* Type Badge */}
              <div style={{ marginBottom: '2rem' }}>
                <span style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  background: selectedFollowUp.member ? '#dbeafe' : '#dcfce7',
                  color: selectedFollowUp.member ? '#1e40af' : '#15803d',
                  display: 'inline-block'
                }}>
                  {selectedFollowUp.member ? '👤 Member Follow-up' : '📋 Enquiry Follow-up'}
                </span>
              </div>

              {/* Member/Enquiry Details */}
              <div style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                  {selectedFollowUp.member ? '👤 Member Information' : '📋 Enquiry Information'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NAME</div>
                    <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>
                      {selectedFollowUp.member?.name || selectedFollowUp.enquiry?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</div>
                    <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>
                      {selectedFollowUp.member ? selectedFollowUp.member.memberId : selectedFollowUp.enquiry?.enquiryId || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MOBILE</div>
                    <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>
                      {selectedFollowUp.member?.mobileNumber || selectedFollowUp.enquiry?.mobileNumber || '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMAIL</div>
                    <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '500', wordBreak: 'break-all' }}>
                      {selectedFollowUp.member?.email || selectedFollowUp.enquiry?.email || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-up Details - WITHOUT CREATED AT */}
              <div style={{ marginBottom: '0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                  📝 Follow-up Details
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NOTE</div>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    background: '#f8fafc',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    color: '#1e293b',
                    fontSize: '1.05rem',
                    lineHeight: '1.6',
                    border: '1px solid #e2e8f0'
                  }}>
                    {selectedFollowUp.note || '-'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FOLLOW-UP DATE</div>
                    <div style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '600' }}>
                      📅 {formatDate(selectedFollowUp.followUpDate)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TIME</div>
                    <div style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '600' }}>
                      🕐 {formatTime(selectedFollowUp.followUpTime)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</div>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: getStatusBadgeColor(selectedFollowUp.status),
                      color: 'white',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      fontSize: '0.95rem'
                    }}>
                      {selectedFollowUp.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ❌ REMOVED "Created By" and "Created At" sections */}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              background: '#f8fafc',
              borderTop: '2px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderRadius: '0 0 16px 16px'
            }}>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  padding: '0.75rem 2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}
              >
                Close
              </button>
              {selectedFollowUp.status === 'pending' && (
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleStatusChange(selectedFollowUp._id, 'completed');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ✅ Mark Completed
                </button>
              )}
              {selectedFollowUp.status === 'completed' && (
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleStatusChange(selectedFollowUp._id, 'pending');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  ⏳ Reopen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedFollowUp && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
                ✏️ Edit Follow-up
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleEditSubmit}>
              <div style={{ padding: '2rem' }}>
                {/* Member/Enquiry Info (Read-only) */}
                <div style={{
                  background: '#f8fafc',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  marginBottom: '2rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', marginBottom: '1rem' }}>
                    {selectedFollowUp.member ? '👤 MEMBER' : '📋 ENQUIRY'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Name</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                        {selectedFollowUp.member?.name || selectedFollowUp.enquiry?.name}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Mobile</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
                        {selectedFollowUp.member?.mobileNumber || selectedFollowUp.enquiry?.mobileNumber}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                    Note <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    value={editFormData.note}
                    onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                    required
                    rows={4}
                    placeholder="Enter follow-up note..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      backgroundColor: 'white',
                      color: '#1e293b'
                    }}
                  />
                </div>

                {/* Follow-up Date */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                    Follow-up Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editFormData.followUpDate}
                    onChange={(e) => setEditFormData({ ...editFormData, followUpDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      colorScheme: 'light'
                    }}
                  />
                </div>

                {/* Follow-up Time */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                    Follow-up Time
                  </label>
                  <input
                    type="time"
                    value={editFormData.followUpTime}
                    onChange={(e) => setEditFormData({ ...editFormData, followUpTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      colorScheme: 'light'
                    }}
                  />
                </div>

                {/* Status */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                    Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      color: '#1e293b'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Form Footer */}
              <div style={{
                padding: '1.5rem 2rem',
                background: '#f8fafc',
                borderTop: '2px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                borderRadius: '0 0 16px 16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'white',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  💾 Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FollowUpMaster;
