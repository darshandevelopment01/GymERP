import React, { useState, useEffect } from 'react';
import GenericMaster from '../../components/Masters/GenericMaster';
import memberApi from '../../services/memberApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import followupApi from '../../services/followupApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { taxSlabAPI, planCategoryAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import './MemberMaster.css';

const MemberMaster = () => {
  const { can, isAdmin } = usePermissions();
  const cacheKeyBranches = 'cache_global_branches';
  const cacheKeyPlans = 'cache_global_plans';
  const cacheKeyStats = 'cache_member_stats';
  const cacheKeyTaxSlabs = 'cache_global_taxSlabs';
  const cacheKeyPlanCategories = 'cache_global_planCategories';

  const getInitialCache = (key, defaultVal) => {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : defaultVal;
  };

  const hasCache = !!sessionStorage.getItem(cacheKeyBranches);

  const [branches, setBranches] = useState(getInitialCache(cacheKeyBranches, []));
  const [plans, setPlans] = useState(getInitialCache(cacheKeyPlans, []));
  const [stats, setStats] = useState(getInitialCache(cacheKeyStats, { total: 0, active: 0, expired: 0 }));
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState(null);
  const [taxSlabs, setTaxSlabs] = useState(getInitialCache(cacheKeyTaxSlabs, []));
  const [planCategories, setPlanCategories] = useState(getInitialCache(cacheKeyPlanCategories, []));
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  const [discountOptions, setDiscountOptions] = useState([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [additionalPayment, setAdditionalPayment] = useState(0);

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState(null);
  const [renewData, setRenewData] = useState({
    planCategory: '',
    plan: '',
    taxSlab: '',
    discountPercentage: 0,
    paymentReceived: 0,
    paymentRemaining: 0,
    membershipStartDate: new Date(),
    membershipEndDate: null
  });

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
    if (!hasCache) setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchBranches(),
        fetchPlans(),
        fetchStats(),
        fetchTaxSlabs(),
        fetchPlanCategories(),
        fetchCurrentUserDiscount()
      ]);
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

  const fetchTaxSlabs = async () => {
    try {
      const response = await taxSlabAPI.getAll();
      const slabs = response.data || [];
      setTaxSlabs(slabs.filter(s => s.status === 'active'));
      sessionStorage.setItem(cacheKeyTaxSlabs, JSON.stringify(slabs.filter(s => s.status === 'active')));
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
      sessionStorage.setItem(cacheKeyPlanCategories, JSON.stringify(cats.filter(c => c.status === 'active')));
    } catch (error) {
      console.error('Error fetching plan categories:', error);
      setPlanCategories([]);
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

  const fetchStats = async () => {
    try {
      const response = await memberApi.getAll();
      if (response.success && response.data) {
        const members = response.data;
        const newStats = {
          total: members.length,
          active: members.filter(m => m.status === 'active').length,
          expired: members.filter(m => m.status === 'expired').length
        };
        setStats(newStats);
        sessionStorage.setItem(cacheKeyStats, JSON.stringify(newStats));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddPayment = (member) => {
    setSelectedMember(member);
    setAdditionalPayment(0);
    setShowPaymentModal(true);
  };

  const handleRenewMember = (member) => {
    setSelectedMemberForRenewal(member);
    const initialRenewData = {
      planCategory: '',
      plan: '',
      taxSlab: '',
      discountPercentage: 0,
      paymentReceived: 0,
      paymentRemaining: 0,
      membershipStartDate: new Date(),
      membershipEndDate: null
    };
    setRenewData(recalcRenewData(initialRenewData));
    setShowRenewModal(true);
  };

  const getDiscountedAmount = (price, discountPct) => {
    const discount = (price * discountPct) / 100;
    return Math.round(price - discount);
  };

  // Compute the full billing breakdown for renewal
  const getRenewBillingBreakdown = () => {
    const selectedPlan = plans.find(p => p._id === renewData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;
    const discountPct = renewData.discountPercentage || 0;
    const discountAmt = Math.round((planAmount * discountPct) / 100);
    const subtotal = planAmount - discountAmt;
    const selectedSlab = taxSlabs.find(s => s._id === renewData.taxSlab);
    const taxPct = selectedSlab ? selectedSlab.taxPercentage : 0;
    const taxAmt = Math.round((subtotal * taxPct) / 100);
    const total = subtotal + taxAmt;
    return { planAmount, discountPct, discountAmt, subtotal, taxPct, taxAmt, total };
  };

  // Recalculate remaining and end date for renewal
  const recalcRenewData = (updatedData) => {
    const selectedPlan = plans.find(p => p._id === updatedData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;
    const discountAmt = Math.round((planAmount * (updatedData.discountPercentage || 0)) / 100);
    const subtotal = planAmount - discountAmt;
    const selectedSlab = taxSlabs.find(s => s._id === updatedData.taxSlab);
    const taxPct = selectedSlab ? selectedSlab.taxPercentage : 0;
    const taxAmt = Math.round((subtotal * taxPct) / 100);
    const total = subtotal + taxAmt;
    const remaining = total - (updatedData.paymentReceived || 0);

    // End date calculation
    let calculatedEndDate = null;
    if (selectedPlan && updatedData.membershipStartDate) {
      const startDate = new Date(updatedData.membershipStartDate);
      let monthsToAdd = 0;
      switch (selectedPlan.duration) {
        case 'Monthly': monthsToAdd = 1; break;
        case 'Two Monthly': monthsToAdd = 2; break;
        case 'Quarterly': monthsToAdd = 3; break;
        case 'Four Monthly': monthsToAdd = 4; break;
        case 'Six Monthly': monthsToAdd = 6; break;
        case 'Yearly': monthsToAdd = 12; break;
        default: monthsToAdd = 0;
      }

      if (monthsToAdd > 0) {
        calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + monthsToAdd);
        calculatedEndDate.setDate(calculatedEndDate.getDate() - 1);
      }
    }

    return {
      ...updatedData,
      paymentRemaining: remaining > 0 ? remaining : 0,
      membershipEndDate: calculatedEndDate
    };
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

      const response = await memberApi.update(selectedMember._id, updateData);

      // 📥 Automatic Download of Receipt
      if (response.receiptBuffer && response.receiptFilename) {
        try {
          const byteCharacters = atob(response.receiptBuffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.receiptFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('✅ Receipt download triggered');
        } catch (downloadErr) {
          console.error('❌ Failed to download receipt:', downloadErr);
        }
      }

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

  const handleRenewSubmit = async (e) => {
    e.preventDefault();

    if (!renewData.plan || !renewData.membershipStartDate || !renewData.membershipEndDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const billing = getRenewBillingBreakdown();
      const updateData = {
        plan: renewData.plan,
        membershipStartDate: renewData.membershipStartDate.toISOString(),
        membershipEndDate: renewData.membershipEndDate.toISOString(),
        status: 'active',
        // Updated billing fields for the new plan
        planAmount: billing.planAmount,
        discountPercentage: billing.discountPct,
        discountAmount: billing.discountAmt,
        taxPercentage: billing.taxPct,
        taxAmount: billing.taxAmt,
        totalAmount: billing.total,
        // Increment lifetime payment and set new pending
        paymentReceived: (selectedMemberForRenewal.paymentReceived || 0) + renewData.paymentReceived,
        paymentRemaining: renewData.paymentRemaining,
        taxSlab: renewData.taxSlab || null
      };

      const response = await memberApi.update(selectedMemberForRenewal._id, updateData);

      // 📥 Automatic Download of Receipt
      if (response.receiptBuffer && response.receiptFilename) {
        try {
          const byteCharacters = atob(response.receiptBuffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.receiptFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          console.log('✅ Receipt download triggered');
        } catch (downloadErr) {
          console.error('❌ Failed to download receipt:', downloadErr);
        }
      }

      alert('✅ Member plan renewed successfully!');
      setShowRenewModal(false);
      setSelectedMemberForRenewal(null);
      fetchInitialData();
    } catch (error) {
      console.error('Error renewing member:', error);
      alert(`❌ Failed to renew member: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRenewPlanChange = (e) => {
    const planId = e.target.value;
    setRenewData(prev => recalcRenewData({ ...prev, plan: planId }));
  };

  const handleRenewDiscountChange = (e) => {
    let discount = parseFloat(e.target.value) || 0;
    if (!noDiscountLimit && discount > maxDiscountPercentage) discount = maxDiscountPercentage;
    if (discount < 0) discount = 0;
    if (discount > 100) discount = 100;
    setRenewData(prev => recalcRenewData({ ...prev, discountPercentage: discount }));
  };

  const handleRenewTaxSlabChange = (e) => {
    const slabId = e.target.value;
    setRenewData(prev => recalcRenewData({ ...prev, taxSlab: slabId }));
  };

  const applyEndDateCalculation = (updatedData, setFormData) => {
    const selectedPlan = plans.find(p => p._id === updatedData.plan);
    if (selectedPlan && updatedData.membershipStartDate) {
      const startDate = new Date(updatedData.membershipStartDate);
      let monthsToAdd = 0;
      switch (selectedPlan.duration) {
        case 'Monthly': monthsToAdd = 1; break;
        case 'Two Monthly': monthsToAdd = 2; break;
        case 'Quarterly': monthsToAdd = 3; break;
        case 'Four Monthly': monthsToAdd = 4; break;
        case 'Six Monthly': monthsToAdd = 6; break;
        case 'Yearly': monthsToAdd = 12; break;
        default: monthsToAdd = 0;
      }

      if (monthsToAdd > 0) {
        const calculatedEndDate = new Date(startDate);
        calculatedEndDate.setMonth(calculatedEndDate.getMonth() + monthsToAdd);
        calculatedEndDate.setDate(calculatedEndDate.getDate() - 1);

        updatedData.membershipEndDate = calculatedEndDate.toISOString().split('T')[0];
      }
    }
    setFormData({ ...updatedData });
  };

  const handleRenewPaymentChange = (e) => {
    const received = parseFloat(e.target.value) || 0;
    setRenewData(prev => recalcRenewData({ ...prev, paymentReceived: received }));
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
      ],
      onChange: (value, formData, setFormData) => {
        const updated = { ...formData, plan: value };
        applyEndDateCalculation(updated, setFormData);
      }
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
      displayValue: (item) => formatDate(item.membershipStartDate),
      onChange: (value, formData, setFormData) => {
        const updated = { ...formData, membershipStartDate: value };
        applyEndDateCalculation(updated, setFormData);
      }
    },
    {
      name: 'membershipEndDate',
      label: 'Membership End Date',
      type: 'date',
      required: false,
      disabled: true,
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

  // Remove blocking loader to allow instant GenericMaster rendering from cache
  // if (loading) {
  //  return (
  //    <div className="loading-container">
  //      <div className="loading-spinner"></div>
  //      <p>Loading Members...</p>
  //    </div>
  //  );
  // }

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
        showEditButton={can('editMember')}
        showDeleteButton={can('deleteMember')}
        showExportButton={true}
        exportFileName="members"
        onAddFollowUp={can('createMemberFollowUp') ? handleAddFollowUp : null}
        customActions={(item) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const end = item.membershipEndDate ? new Date(item.membershipEndDate) : null;
          if (end) end.setHours(0, 0, 0, 0);

          const isExpired = item.status === 'expired' || (end && end < today);
          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {item.paymentRemaining > 0 && can('collectPayment') && (
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
                    fontWeight: '600'
                  }}
                >
                  💰 Add Payment
                </button>
              )}
              {isExpired && can('editMember') && (
                <button
                  className="btn-renew"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenewMember(item);
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
                  🔄 Renew
                </button>
              )}
            </div>
          );
        }}
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

      {/* Renew Modal */}
      {showRenewModal && selectedMemberForRenewal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <h2 style={{ color: 'white' }}>🔄 Renew Membership</h2>
              <button className="btn-close" onClick={() => setShowRenewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleRenewSubmit}>
              <div className="form-content">
                <div className="member-info" style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Member Details</h3>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Name:</strong> {selectedMemberForRenewal.name}</p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Member ID:</strong> {selectedMemberForRenewal.memberId}</p>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Previous Plan:</strong> {selectedMemberForRenewal.plan?.planName || '-'}</p>
                </div>

                <div className="form-group">
                  <label>Plan Category <span className="required">*</span></label>
                  <select
                    value={renewData.planCategory}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setRenewData(prev => recalcRenewData({ ...prev, planCategory: catId, plan: '' }));
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
                    value={renewData.plan}
                    onChange={handleRenewPlanChange}
                    required
                    disabled={!renewData.planCategory}
                  >
                    <option value="">{renewData.planCategory ? 'Select Membership Plan' : 'Select a category first'}</option>
                    {plans
                      .filter(p => {
                        if (!renewData.planCategory) return false;
                        const catId = typeof p.category === 'object' ? p.category?._id : p.category;
                        return catId === renewData.planCategory;
                      })
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          {p.planName} - ₹{p.price} ({p.duration})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Membership Start Date <span className="required">*</span></label>
                  <DatePicker
                    selected={renewData.membershipStartDate}
                    onChange={(date) => setRenewData(prev => recalcRenewData({ ...prev, membershipStartDate: date }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select start date"
                    required
                    className="custom-datepicker"
                    wrapperClassName="datepicker-wrapper"
                  />
                </div>

                <div className="form-group">
                  <label>Membership End Date</label>
                  <DatePicker
                    selected={renewData.membershipEndDate}
                    onChange={() => { }} // Read-only
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Calculated automatically"
                    disabled
                    className="custom-datepicker"
                    wrapperClassName="datepicker-wrapper"
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Tax Slab Dropdown */}
                <div className="form-group">
                  <label>Tax Slab (GST)</label>
                  <select
                    value={renewData.taxSlab}
                    onChange={handleRenewTaxSlabChange}
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
                {can('noDiscountLimit') && (
                  <div className="form-group">
                    <label>Discount %</label>
                    <select
                      value={renewData.discountPercentage}
                      onChange={handleRenewDiscountChange}
                    >
                      <option value={0}>0% (No Discount)</option>
                      {discountOptions.map(val => (
                        <option key={val} value={val}>{val}%</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Payment Received <span className="required">*</span></label>
                  <input
                    type="number"
                    value={renewData.paymentReceived}
                    onChange={handleRenewPaymentChange}
                    required
                    min="0"
                    placeholder="Enter amount received"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Remaining</label>
                  <input
                    type="number"
                    value={renewData.paymentRemaining}
                    readOnly
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Billing Summary */}
                {renewData.plan && (() => {
                  const b = getRenewBillingBreakdown();
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
                        <span>New Plan Amount</span>
                        <span style={{ fontWeight: '600' }}>₹{b.planAmount}</span>
                      </div>
                      {b.discountPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#16a34a', fontSize: '0.9rem' }}>
                          <span>Discount ({b.discountPct}%)</span>
                          <span style={{ fontWeight: '600' }}>- ₹{b.discountAmt}</span>
                        </div>
                      )}
                      {b.taxPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#ea580c', fontSize: '0.9rem' }}>
                          <span>GST ({b.taxPct}%)</span>
                          <span style={{ fontWeight: '600' }}>+ ₹{b.taxAmt}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #f59e0b', paddingTop: '0.5rem', marginTop: '0.35rem', color: '#1e293b', fontSize: '1rem' }}>
                        <span style={{ fontWeight: '700' }}>Renewal Total</span>
                        <span style={{ fontWeight: '700', color: '#f59e0b' }}>₹{b.total}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowRenewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                }}>
                  ✅ Renew Membership
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
