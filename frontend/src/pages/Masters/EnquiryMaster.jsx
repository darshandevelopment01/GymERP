import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GenericMaster from '../../components/Masters/GenericMaster';
import enquiryApi from '../../services/enquiryApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import memberApi from '../../services/memberApi';
import './EnquiryMaster.css';

const EnquiryMaster = () => {
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [paymentData, setPaymentData] = useState({
    plan: '',
    dateOfBirth: null,
    paymentReceived: 0,
    paymentRemaining: 0
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
      const response = await enquiryApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setStats({ total: 0, confirmed: 0, thisMonth: 0 });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, confirmed: 0, thisMonth: 0 });
    }
  };

  const handleConvertToMember = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setPaymentData({
      plan: enquiry.plan?._id || '',
      dateOfBirth: enquiry.dateOfBirth ? new Date(enquiry.dateOfBirth) : null,
      paymentReceived: 0,
      paymentRemaining: 0
    });
    setShowPaymentModal(true);
  };

  const handlePaymentChange = (e) => {
    const received = parseFloat(e.target.value) || 0;
    const selectedPlan = plans.find(p => p._id === paymentData.plan);
    const totalAmount = selectedPlan ? selectedPlan.price : 0;
    const remaining = totalAmount - received;

    setPaymentData({
      ...paymentData,
      paymentReceived: received,
      paymentRemaining: remaining > 0 ? remaining : 0
    });
  };

  const handlePlanChangeInPayment = (e) => {
    const planId = e.target.value;
    const selectedPlan = plans.find(p => p._id === planId);
    const totalAmount = selectedPlan ? selectedPlan.price : 0;
    const remaining = totalAmount - paymentData.paymentReceived;

    setPaymentData({
      ...paymentData,
      plan: planId,
      paymentRemaining: remaining > 0 ? remaining : 0
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentData.plan || !paymentData.dateOfBirth || paymentData.paymentReceived <= 0) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const dobDate = typeof paymentData.dateOfBirth === 'string' 
        ? new Date(paymentData.dateOfBirth) 
        : paymentData.dateOfBirth;

      const memberData = {
        name: selectedEnquiry.name,
        email: selectedEnquiry.email,
        mobileNumber: selectedEnquiry.mobileNumber,
        dateOfBirth: dobDate.toISOString(),
        gender: selectedEnquiry.gender,
        branch: selectedEnquiry.branch._id || selectedEnquiry.branch,
        plan: paymentData.plan,
        paymentReceived: paymentData.paymentReceived,
        paymentRemaining: paymentData.paymentRemaining,
        status: 'active',
        membershipStartDate: new Date().toISOString(),
        enquiryId: selectedEnquiry._id
      };

      console.log('Sending member data:', memberData);

      const response = await memberApi.create(memberData);
      console.log('Member created:', response);
      
      await enquiryApi.update(selectedEnquiry._id, { status: 'converted' });

      alert('✅ Enquiry converted to Member successfully!');
      setShowPaymentModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error converting to member:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`❌ Failed to convert to member: ${errorMessage}`);
    }
  };

  const columns = [
    {
      label: 'Enquiry ID',
      field: 'enquiryId'
    },
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
      label: 'Source',
      field: 'source'
    },
    {
      label: 'Status',
      field: 'status',
      render: (item) => (
        <span className={`status-badge status-${item.status}`}>
          {item.status}
        </span>
      )
    }
  ];

  const formFields = [
    {
      name: 'branch',
      label: 'Branch',
      type: 'select',
      required: true,
      options: branches.map(b => ({
        value: b._id,
        label: b.name
      }))
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
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' }
      ]
    },
    {
      name: 'source',
      label: 'Enquiry Source',
      type: 'select',
      required: true,
      options: [
        { value: 'Walk-in', label: 'Walk-in' },
        { value: 'Social Media', label: 'Social Media' },
        { value: 'Referral', label: 'Referral' },
        { value: 'Website', label: 'Website' },
        { value: 'Phone Call', label: 'Phone Call' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      name: 'followUpDate',
      label: 'Follow Up Date',
      type: 'date',
      required: false,
      placeholder: 'Select follow-up date',
      futureOnly: true
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Add any additional notes or comments...'
    }
  ];

  // Filter configuration for Enquiry
  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'converted', label: 'Converted' }
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
      name: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { value: '', label: 'All Sources' },
        { value: 'Walk-in', label: 'Walk-in' },
        { value: 'Social Media', label: 'Social Media' },
        { value: 'Referral', label: 'Referral' },
        { value: 'Website', label: 'Website' },
        { value: 'Phone Call', label: 'Phone Call' }
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
        <p>Loading Enquiry Master...</p>
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
    <div className="enquiry-master-page">
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Enquiries</p>
          </div>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.confirmed}</h3>
            <p>Confirmed</p>
          </div>
        </div>
        <div className="stat-card this-month">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.thisMonth}</h3>
            <p>This Month</p>
          </div>
        </div>
      </div>

      <GenericMaster
        title="Enquiry Master"
        apiService={enquiryApi}
        columns={columns}
        formFields={formFields}
        filterConfig={filterConfig}
        searchPlaceholder="Search by name, mobile, email, or enquiry ID..."
        icon="👥"
        customActions={(item) => (
          item.status !== 'converted' && (
            <button 
              className="btn-convert" 
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToMember(item);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
              💳 Convert to Member
            </button>
          )
        )}
      />

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Convert to Member - Payment Details</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmitPayment}>
              <div className="form-content">
                <div className="enquiry-info" style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Enquiry Details</h3>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Name:</strong> {selectedEnquiry?.name}</p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Email:</strong> {selectedEnquiry?.email}</p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Mobile:</strong> {selectedEnquiry?.mobileNumber}</p>
                </div>

                <div className="form-group">
                  <label>Membership Plan <span className="required">*</span></label>
                  <select
                    value={paymentData.plan}
                    onChange={handlePlanChangeInPayment}
                    required
                  >
                    <option value="">Select Membership Plan</option>
                    {plans.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.planName} - ₹{p.price} ({p.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date of Birth <span className="required">*</span></label>
                  <DatePicker
                    selected={paymentData.dateOfBirth}
                    onChange={(date) => setPaymentData({ ...paymentData, dateOfBirth: date })}
                    dateFormat="dd/MM/yyyy"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    placeholderText="Select date of birth"
                    required
                    className="custom-datepicker"
                    wrapperClassName="datepicker-wrapper"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Received <span className="required">*</span></label>
                  <input
                    type="number"
                    value={paymentData.paymentReceived}
                    onChange={handlePaymentChange}
                    required
                    min="0"
                    placeholder="Enter amount received"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Remaining</label>
                  <input
                    type="number"
                    value={paymentData.paymentRemaining}
                    readOnly
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                {paymentData.plan && (
                  <div style={{
                    background: '#dbeafe',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    <p style={{ margin: 0, color: '#1e40af', fontWeight: '600' }}>
                      Total Plan Amount: ₹{plans.find(p => p._id === paymentData.plan)?.price || 0}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}>
                  ✅ Convert to Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryMaster;
