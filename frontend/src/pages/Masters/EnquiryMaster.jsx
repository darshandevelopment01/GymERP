import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GenericMaster from '../../components/Masters/GenericMaster';
import enquiryApi from '../../services/enquiryApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import memberApi from '../../services/memberApi';
import followupApi from '../../services/followupApi';
import { taxSlabAPI, planCategoryAPI } from '../../services/mastersApi';
import './EnquiryMaster.css';

const EnquiryMaster = () => {
  const cacheKeyBranches = 'cache_global_branches';
  const cacheKeyPlans = 'cache_global_plans';
  const cacheKeyStats = 'cache_enq_stats';
  const cacheKeyTaxSlabs = 'cache_global_taxSlabs';
  const cacheKeyPlanCategories = 'cache_global_planCategories';

  const getInitialCache = (key, defaultVal) => {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : defaultVal;
  };

  const hasCache = !!sessionStorage.getItem(cacheKeyBranches);

  const [branches, setBranches] = useState(getInitialCache(cacheKeyBranches, []));
  const [plans, setPlans] = useState(getInitialCache(cacheKeyPlans, []));
  const [stats, setStats] = useState(getInitialCache(cacheKeyStats, { total: 0, pending: 0, thisMonth: 0 }));
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState(null);
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState(getInitialCache(cacheKeyTaxSlabs, []));
  const [planCategories, setPlanCategories] = useState(getInitialCache(cacheKeyPlanCategories, []));
  const [isAdmin, setIsAdmin] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [paymentData, setPaymentData] = useState({
    planCategory: '',
    plan: '',
    dateOfBirth: null,
    taxSlab: '',
    discountPercentage: 0,
    paymentReceived: 0,
    paymentRemaining: 0
  });

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedEnquiryForFollowUp, setSelectedEnquiryForFollowUp] = useState(null);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    if (!hasCache) setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBranches(),
        fetchPlans(),
        fetchStats(),
        fetchCurrentUserDiscount(),
        fetchTaxSlabs(),
        fetchPlanCategories()
      ]);
      // Check if user is admin
      try {
        const token = localStorage.getItem('token');
        const meRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (meData.data?.userType === 'Admin') setIsAdmin(true);
      } catch (e) {
        console.error('Admin check failed:', e);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      if (!hasCache) setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchApi.getAll();
      const branchData = Array.isArray(response) ? response : (response.data || []);
      const activeBranches = branchData.filter(b => b.status === 'active');
      setBranches(activeBranches);
      sessionStorage.setItem(cacheKeyBranches, JSON.stringify(activeBranches));
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await planApi.getAll();
      const planData = response.data || [];
      const activePlans = planData.filter(p => p.status === 'active');
      setPlans(activePlans);
      sessionStorage.setItem(cacheKeyPlans, JSON.stringify(activePlans));
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await enquiryApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        sessionStorage.setItem(cacheKeyStats, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCurrentUserDiscount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setMaxDiscountPercentage(result.data.maxDiscountPercentage || 0);
        setNoDiscountLimit(result.data.noDiscountLimit || false);
        setDiscountOptions(result.data.discountOptions || []);
      }
    } catch (error) {
      console.error('Error fetching user discount:', error);
      setMaxDiscountPercentage(0);
      setNoDiscountLimit(false);
      setDiscountOptions([]);
    }
  };

  const fetchTaxSlabs = async () => {
    try {
      const response = await taxSlabAPI.getAll();
      const slabs = response.data || [];
      setTaxSlabs(slabs.filter(s => s.status === 'active'));
    } catch (error) {
      console.error('Error fetching tax slabs:', error);
      setTaxSlabs([]);
    }
  };

  const fetchPlanCategories = async () => {
    try {
      const response = await planCategoryAPI.getAll();
      const cats = response.data || [];
      setPlanCategories(cats.filter(c => c.status === 'active'));
    } catch (error) {
      console.error('Error fetching plan categories:', error);
      setPlanCategories([]);
    }
  };

  const handleConvertToMember = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setPaymentData({
      planCategory: '',
      plan: enquiry.plan?._id || '',
      dateOfBirth: enquiry.dateOfBirth ? new Date(enquiry.dateOfBirth) : null,
      taxSlab: '',
      discountPercentage: 0,
      paymentReceived: 0,
      paymentRemaining: 0
    });
    setShowPaymentModal(true);
  };

  const handleAddFollowUp = (enquiry) => {
    console.log('📝 Adding follow-up for enquiry:', enquiry);
    setSelectedEnquiryForFollowUp(enquiry);
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
        enquiry: selectedEnquiryForFollowUp._id,
        note: followUpData.note,
        followUpDate: followUpData.followUpDate
          ? followUpData.followUpDate.toISOString().split('T')[0]
          : null,
        followUpTime: followUpData.followUpTime || null
      });

      alert('✅ Follow-up added successfully!');
      setShowFollowUpModal(false);
      setSelectedEnquiryForFollowUp(null);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
    } catch (error) {
      console.error('Error adding follow-up:', error);
      alert('❌ Failed to add follow-up. Please try again.');
    }
  };

  const getDiscountedAmount = (price, discountPct) => {
    const discount = (price * discountPct) / 100;
    return Math.round(price - discount);
  };

  // Compute the full billing breakdown
  const getBillingBreakdown = () => {
    const selectedPlan = plans.find(p => p._id === paymentData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;
    const discountPct = paymentData.discountPercentage || 0;
    const discountAmt = Math.round((planAmount * discountPct) / 100);
    const subtotal = planAmount - discountAmt;
    const selectedSlab = taxSlabs.find(s => s._id === paymentData.taxSlab);
    const taxPct = selectedSlab ? selectedSlab.taxPercentage : 0;
    const taxAmt = Math.round((subtotal * taxPct) / 100);
    const total = subtotal + taxAmt;
    return { planAmount, discountPct, discountAmt, subtotal, taxPct, taxAmt, total };
  };

  // Recalculate remaining whenever any billing field changes
  const recalcRemaining = (updatedData) => {
    const selectedPlan = plans.find(p => p._id === updatedData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;
    const discountAmt = Math.round((planAmount * (updatedData.discountPercentage || 0)) / 100);
    const subtotal = planAmount - discountAmt;
    const selectedSlab = taxSlabs.find(s => s._id === updatedData.taxSlab);
    const taxPct = selectedSlab ? selectedSlab.taxPercentage : 0;
    const taxAmt = Math.round((subtotal * taxPct) / 100);
    const total = subtotal + taxAmt;
    const remaining = total - (updatedData.paymentReceived || 0);
    return { ...updatedData, paymentRemaining: remaining > 0 ? remaining : 0 };
  };

  const handlePaymentChange = (e) => {
    const received = parseFloat(e.target.value) || 0;
    setPaymentData(prev => recalcRemaining({ ...prev, paymentReceived: received }));
  };

  const handleDiscountChange = (e) => {
    let discount = parseFloat(e.target.value) || 0;
    if (!noDiscountLimit && discount > maxDiscountPercentage) discount = maxDiscountPercentage;
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setPaymentData(prev => recalcRemaining({ ...prev, discountPercentage: discount }));
  };

  const handlePlanChangeInPayment = (e) => {
    const planId = e.target.value;
    setPaymentData(prev => recalcRemaining({ ...prev, plan: planId }));
  };

  const handleTaxSlabChange = (e) => {
    const slabId = e.target.value;
    setPaymentData(prev => recalcRemaining({ ...prev, taxSlab: slabId }));
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

      const billing = getBillingBreakdown();

      const memberData = {
        name: selectedEnquiry.name,
        email: selectedEnquiry.email,
        mobileNumber: selectedEnquiry.mobileNumber,
        dateOfBirth: dobDate.toISOString(),
        gender: selectedEnquiry.gender,
        branch: selectedEnquiry.branch._id || selectedEnquiry.branch,
        plan: paymentData.plan,
        // Pricing breakdown
        ...(paymentData.taxSlab && { taxSlab: paymentData.taxSlab }),
        planAmount: billing.planAmount,
        discountPercentage: billing.discountPct,
        discountAmount: billing.discountAmt,
        taxPercentage: billing.taxPct,
        taxAmount: billing.taxAmt,
        totalAmount: billing.total,
        paymentReceived: paymentData.paymentReceived,
        paymentRemaining: paymentData.paymentRemaining,
        status: 'active',
        membershipStartDate: new Date().toISOString(),
        enquiryId: selectedEnquiry._id,
        ...(selectedEnquiry.profilePhoto && { profilePhoto: selectedEnquiry.profilePhoto })
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
      mobileHide: true,
      render: (item) => (
        <span style={{ fontSize: '0.9rem' }}>{item.email}</span>
      )
    },
    {
      label: 'Branch',
      field: 'branch',
      mobileHide: true,
      render: (item) => item.branch?.name || '-'
    },
    {
      label: 'Source',
      field: 'source',
      mobileHide: true,
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
    // Created By column - admin only
    ...(isAdmin ? [{
      label: 'Created By',
      field: 'createdBy',
      mobileHide: true,
      render: (item) => (
        <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: '600' }}>
          {item.createdBy?.name || '-'}
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
      name: 'source',
      label: 'Enquiry Source',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Source' },
        { value: 'Walk-in', label: 'Walk-in' },
        { value: 'Social Media', label: 'Social Media' },
        { value: 'Referral', label: 'Referral' },
        { value: 'Website', label: 'Website' },
        { value: 'Phone Call', label: 'Phone Call' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Add any additional notes or comments...'
    }
  ];

  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
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
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending || 0}</h3>
            <p>Pending</p>
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
        showCreateButton={true}
        showExportButton={true}
        exportFileName="enquiries"
        onAddFollowUp={handleAddFollowUp}
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

      {/* Payment Modal */}
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
                  <label>Plan Category <span className="required">*</span></label>
                  <select
                    value={paymentData.planCategory}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setPaymentData(prev => recalcRemaining({ ...prev, planCategory: catId, plan: '' }));
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {planCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Membership Plan <span className="required">*</span></label>
                  <select
                    value={paymentData.plan}
                    onChange={handlePlanChangeInPayment}
                    required
                    disabled={!paymentData.planCategory}
                  >
                    <option value="">{paymentData.planCategory ? 'Select Membership Plan' : 'Select a category first'}</option>
                    {plans
                      .filter(p => {
                        if (!paymentData.planCategory) return false;
                        const catId = typeof p.category === 'object' ? p.category?._id : p.category;
                        return catId === paymentData.planCategory;
                      })
                      .map(p => (
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

                {/* Tax Slab Dropdown */}
                <div className="form-group">
                  <label>Tax Slab (GST)</label>
                  <select
                    value={paymentData.taxSlab}
                    onChange={handleTaxSlabChange}
                  >
                    <option value="">No Tax</option>
                    {taxSlabs.map(slab => (
                      <option key={slab._id} value={slab._id}>
                        GST {slab.taxPercentage}%
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount */}
                <div className="form-group">
                  <label>
                    Discount %{' '}
                    {noDiscountLimit ? (
                      <span style={{ color: '#10b981', fontWeight: '400', fontSize: '0.8rem' }}>
                        (No Limit)
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontWeight: '400', fontSize: '0.8rem' }}>
                        (Max: {maxDiscountPercentage}%)
                      </span>
                    )}
                  </label>
                  <select
                    value={paymentData.discountPercentage}
                    onChange={handleDiscountChange}
                  >
                    <option value={0}>0% (No Discount)</option>
                    {discountOptions.map(val => (
                      <option key={val} value={val}>{val}%</option>
                    ))}
                  </select>
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

                {/* Billing Summary */}
                {paymentData.plan && (() => {
                  const b = getBillingBreakdown();
                  return (
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '1rem 1.25rem',
                      borderRadius: '10px',
                      marginTop: '1rem',
                    }}>
                      <h4 style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '0.95rem' }}>💰 Billing Summary</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#475569', fontSize: '0.9rem' }}>
                        <span>Plan Amount</span>
                        <span style={{ fontWeight: '600' }}>₹{b.planAmount}</span>
                      </div>
                      {b.discountPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#16a34a', fontSize: '0.9rem' }}>
                          <span>Discount ({b.discountPct}%)</span>
                          <span style={{ fontWeight: '600' }}>- ₹{b.discountAmt}</span>
                        </div>
                      )}
                      {b.discountPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#475569', fontSize: '0.85rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem' }}>
                          <span>Subtotal</span>
                          <span style={{ fontWeight: '600' }}>₹{b.subtotal}</span>
                        </div>
                      )}
                      {b.taxPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#ea580c', fontSize: '0.9rem' }}>
                          <span>GST ({b.taxPct}%)</span>
                          <span style={{ fontWeight: '600' }}>+ ₹{b.taxAmt}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #10b981', paddingTop: '0.5rem', marginTop: '0.35rem', color: '#1e293b', fontSize: '1rem' }}>
                        <span style={{ fontWeight: '700' }}>Total Amount</span>
                        <span style={{ fontWeight: '700', color: '#10b981' }}>₹{b.total}</span>
                      </div>
                    </div>
                  );
                })()}
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

      {/* Follow-up Modal */}
      {showFollowUpModal && selectedEnquiryForFollowUp && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal-content followup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#10b981' }}>
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
                    <strong>Enquiry:</strong> {selectedEnquiryForFollowUp.name}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong>Enquiry ID:</strong> {selectedEnquiryForFollowUp.enquiryId}
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

                {/* ✅ Updated Follow-up Time with Clock Icon */}
                <div className="form-group">
                  <label>Follow-up Time (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="time"
                      value={followUpData.followUpTime}
                      onChange={(e) => setFollowUpData({ ...followUpData, followUpTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '1rem'
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
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ background: '#10b981' }}>
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
                    background: 'white',
                    color: '#10b981',
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

export default EnquiryMaster;
