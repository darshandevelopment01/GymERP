import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import memberApi from '../../services/memberApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import followupApi from '../../services/followupApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MemberMaster.css';

const MemberMaster = () => {
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [additionalPayment, setAdditionalPayment] = useState(0);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedMemberForFollowUp, setSelectedMemberForFollowUp] = useState(null);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBranches(),
        fetchPlans(),
        fetchStats()
      ]);
      // Check if user is admin
      try {
        const token = localStorage.getItem('token');
        const meRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
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

  const fetchBranches = async () => {
    try {
      const response = await branchApi.getAll();
      const branchData = Array.isArray(response) ? response : (response.data || []);
      const activeBranches = branchData.filter(b => b.status === 'active');
      setBranches(activeBranches);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await planApi.getAll();
      const planData = response.data || [];
      const activePlans = planData.filter(p => p.status === 'active');
      setPlans(activePlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await memberApi.getAll();
      if (response.success && response.data) {
        const members = response.data;
        setStats({
          total: members.length,
          active: members.filter(m => m.status === 'active').length,
          expired: members.filter(m => m.status === 'expired').length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, active: 0, expired: 0 });
    }
  };

  const handleAddPayment = (member) => {
    setSelectedMember(member);
    setAdditionalPayment(0);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (additionalPayment <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      const updatedPaymentReceived = (selectedMember.paymentReceived || 0) + additionalPayment;
      const updatedPaymentRemaining = Math.max(0, (selectedMember.paymentRemaining || 0) - additionalPayment);

      const updateData = {
        paymentReceived: updatedPaymentReceived,
        paymentRemaining: updatedPaymentRemaining
      };

      await memberApi.update(selectedMember._id, updateData);

      alert('✅ Payment added successfully!');
      setShowPaymentModal(false);
      setSelectedMember(null);
      setAdditionalPayment(0);
      fetchInitialData();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('❌ Failed to add payment. Please try again.');
    }
  };

  const handleAddFollowUp = (member) => {
    console.log('📝 Adding follow-up for:', member);
    setSelectedMemberForFollowUp(member);
    setFollowUpData({
      note: '',
      followUpDate: null,
      followUpTime: ''
    });
    setShowFollowUpModal(true);
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();

    if (!followUpData.note.trim()) {
      alert('Please enter follow-up notes');
      return;
    }

    try {
      await followupApi.create({
        member: selectedMemberForFollowUp._id,
        note: followUpData.note,
        followUpDate: followUpData.followUpDate
          ? followUpData.followUpDate.toISOString().split('T')[0]
          : null,
        followUpTime: followUpData.followUpTime || null
      });

      alert('✅ Follow-up added successfully!');
      setShowFollowUpModal(false);
      setSelectedMemberForFollowUp(null);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
    } catch (error) {
      console.error('Error adding follow-up:', error);
      alert('❌ Failed to add follow-up. Please try again.');
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

  const columns = [
    {
      label: 'Name',
      field: 'name'
    },
    {
      label: 'Mobile',
      field: 'mobileNumber'
    },
    {
      label: 'Email',
      field: 'email',
      render: (item) => (
        <span style={{ fontSize: '0.9rem' }}>{item.email}</span>
      )
    },
    {
      label: 'Branch',
      field: 'branch',
      render: (item) => item.branch?.name || '-'
    },
    {
      label: 'Plan',
      field: 'plan',
      render: (item) => item.plan?.planName || '-'
    },
    {
      label: 'Payment',
      field: 'payment',
      render: (item) => (
        <div>
          <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
            ₹{item.paymentReceived || 0}
          </div>
          {item.paymentRemaining > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
              Pending: ₹{item.paymentRemaining}
            </div>
          )}
        </div>
      )
    },
    {
      label: 'Status',
      field: 'status',
      render: (item) => (
        <span className={`status-badge status-${item.status}`}>
          {item.status}
        </span>
      )
    },
    // Converted By column - admin only
    ...(isAdmin ? [{
      label: 'Converted By',
      field: 'convertedBy',
      render: (item) => (
        <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>
          {item.convertedBy?.name || '-'}
        </span>
      )
    }] : [])
  ];

  const formFields = [
    {
      name: 'profilePhoto',
      label: 'Profile Photo',
      type: 'image-upload',
      required: false,
    },
    {
      name: 'branch',
      label: 'Branch',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Branch' },
        ...branches.map(b => ({
          value: b._id,
          label: b.name
        }))
      ]
    },
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name'
    },
    {
      name: 'mobileNumber',
      label: 'Mobile Number',
      type: 'tel',
      required: true,
      placeholder: 'Enter 10-digit mobile number'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter email address'
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'date',
      required: true
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
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      name: 'plan',
      label: 'Membership Plan',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Plan' },
        ...plans.map(p => ({
          value: p._id,
          label: `${p.planName} - ₹${p.price}`
        }))
      ]
    },
    {
      name: 'paymentReceived',
      label: 'Payment Received',
      type: 'number',
      required: true,
      placeholder: 'Enter amount'
    },
    {
      name: 'membershipStartDate',
      label: 'Membership Start Date',
      type: 'date',
      required: false,
      displayValue: (item) => formatDate(item.membershipStartDate)
    },
    {
      name: 'membershipEndDate',
      label: 'Membership End Date',
      type: 'date',
      required: false,
      displayValue: (item) => formatDate(item.membershipEndDate)
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'Select Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expiring', label: 'Expiring' },
        { value: 'expired', label: 'Expired' }
      ]
    }
  ];

  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'expiring', label: 'Expiring' },
        { value: 'expired', label: 'Expired' }
      ]
    },
    {
      name: 'branch',
      label: 'Branch',
      type: 'select',
      options: [
        { value: '', label: 'All Branches' },
        ...branches.map(b => ({
          value: b._id,
          label: b.name
        }))
      ]
    },
    {
      name: 'plan',
      label: 'Plan',
      type: 'select',
      options: [
        { value: '', label: 'All Plans' },
        ...plans.map(p => ({
          value: p._id,
          label: p.planName
        }))
      ]
    },
    {
      name: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: '', label: 'All Payments' },
        { value: 'paid', label: 'Fully Paid' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date'
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'date'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Members...</p>
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
    <div className="member-master-page">
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active</p>
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
        title="Member Management"
        apiService={memberApi}
        columns={columns}
        formFields={formFields}
        filterConfig={filterConfig}
        searchPlaceholder="Search by name, mobile, email, or member ID..."
        showCreateButton={false}
        showExportButton={true}
        exportFileName="members"
        onAddFollowUp={handleAddFollowUp}
        customActions={(item) => (
          item.paymentRemaining > 0 && (
            <button
              className="btn-add-payment"
              onClick={(e) => {
                e.stopPropagation();
                handleAddPayment(item);
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
                marginLeft: '0.5rem'
              }}
            >
              💰 Add Payment
            </button>
          )
        )}
      />

      {/* Add Payment Modal */}
      {showPaymentModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>💰 Add Payment</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-content">
                <div className="member-info" style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>Member Details</h3>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Name:</strong> {selectedMember.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Member ID:</strong> {selectedMember.memberId}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Plan:</strong> {selectedMember.plan?.planName || '-'}
                  </p>
                </div>

                <div style={{
                  background: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '0.9rem' }}>
                    <strong>Payment Received:</strong> ₹{selectedMember.paymentReceived || 0}
                  </p>
                  <p style={{ margin: '0', color: '#ef4444', fontSize: '0.95rem', fontWeight: '700' }}>
                    <strong>Pending Amount:</strong> ₹{selectedMember.paymentRemaining || 0}
                  </p>
                </div>

                <div className="form-group">
                  <label>Additional Payment Amount <span className="required">*</span></label>
                  <input
                    type="number"
                    value={additionalPayment}
                    onChange={(e) => setAdditionalPayment(parseFloat(e.target.value) || 0)}
                    required
                    min="1"
                    max={selectedMember.paymentRemaining}
                    placeholder="Enter payment amount"
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                    Maximum: ₹{selectedMember.paymentRemaining}
                  </small>
                </div>

                {additionalPayment > 0 && (
                  <div style={{
                    background: '#dbeafe',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '0.9rem' }}>
                      <strong>New Total Received:</strong> ₹{(selectedMember.paymentReceived || 0) + additionalPayment}
                    </p>
                    <p style={{ margin: '0', color: '#1e40af', fontSize: '0.9rem' }}>
                      <strong>Remaining After Payment:</strong> ₹{Math.max(0, (selectedMember.paymentRemaining || 0) - additionalPayment)}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                }}>
                  ✅ Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedMemberForFollowUp && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal-content followup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#1f2937' }}>
              <h2 style={{ color: 'white' }}>📝 Add Follow-up</h2>
              <button className="btn-close" onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>

            <form onSubmit={handleFollowUpSubmit}>
              <div className="form-content" style={{ background: 'white' }}>
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Member:</strong> {selectedMemberForFollowUp.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Member ID:</strong> {selectedMemberForFollowUp.memberId}
                  </p>
                </div>

                <div className="form-group">
                  <label>Note <span className="required">*</span></label>
                  <textarea
                    value={followUpData.note}
                    onChange={(e) => setFollowUpData({ ...followUpData, note: e.target.value })}
                    required
                    rows="4"
                    placeholder="Enter follow-up notes..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Next Follow-up Date (Optional)</label>
                  <div className="date-input-wrapper" style={{ position: 'relative' }}>
                    <DatePicker
                      selected={followUpData.followUpDate}
                      onChange={(date) => setFollowUpData({ ...followUpData, followUpDate: date })}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select date"
                      className="form-input date-input-with-icon"
                      minDate={new Date()}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      isClearable
                      showPopperArrow={false}
                      wrapperClassName="followup-datepicker-wrapper"
                      calendarClassName="followup-calendar"
                    />
                    <svg
                      className="calendar-icon-svg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        color: '#94a3b8',
                        pointerEvents: 'none'
                      }}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>

                {/* Follow-up Time with Clock Icon */}
                <div className="form-group">
                  <label>Follow-up Time (Optional)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      id="followup-time-input"
                      type="time"
                      value={followUpData.followUpTime}
                      onChange={(e) => setFollowUpData({ ...followUpData, followUpTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 3rem 0.75rem 0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      onClick={() => document.getElementById('followup-time-input').showPicker()}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '20px',
                        height: '20px',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ background: '#1f2937' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowFollowUpModal(false)}
                  style={{
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  💾 Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberMaster;
