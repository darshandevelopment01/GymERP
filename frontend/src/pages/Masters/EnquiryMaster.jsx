import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GenericMaster from '../../components/Masters/GenericMaster';
import enquiryApi from '../../services/enquiryApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import memberApi from '../../services/memberApi';
import followupApi from '../../services/followupApi';
import { taxSlabAPI, planCategoryAPI, employeeAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import { compressImage } from '../../utils/compressImage';
import { formatLocalDate } from '../../utils/dateUtils';
import CameraModal from '../../components/CameraModal';
import './EnquiryMaster.css';

const EnquiryMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isAdmin, userBranches } = usePermissions();
  const [showCamera, setShowCamera] = useState(false);
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
  const [stats, setStats] = useState(getInitialCache(cacheKeyStats, { total: 0, pending: 0, converted: 0, lost: 0, thisMonth: 0 }));
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState(null);
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'value'
  const [discountWarning, setDiscountWarning] = useState('');
  const [discountInputValue, setDiscountInputValue] = useState(0); 
  const [taxSlabs, setTaxSlabs] = useState(getInitialCache(cacheKeyTaxSlabs, []));
  const [planCategories, setPlanCategories] = useState(getInitialCache(cacheKeyPlanCategories, []));
  const [employees, setEmployees] = useState([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [paymentData, setPaymentData] = useState({
    planCategory: '',
    plan: '',
    taxSlab: '',
    discountPercentage: 0,
    paymentRemaining: 0,
    membershipStartDate: new Date(),
    membershipEndDate: null,
    nextPaymentDate: null,
    profilePhoto: ''
  });

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedEnquiryForFollowUp, setSelectedEnquiryForFollowUp] = useState(null);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });
  const [submittingConvert, setSubmittingConvert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ✅ DUPLICATE ENQUIRY STATES
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [submittingReopen, setSubmittingReopen] = useState(false);
  const [liveDuplicate, setLiveDuplicate] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState(location.state?.filterStatus || '');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  // ✅ Handle external filters
  const externalFilters = React.useMemo(() => {
    return activeStatusFilter ? { status: activeStatusFilter } : {};
  }, [activeStatusFilter]);

  // ✅ Debounced Duplicate Check
  useEffect(() => {
    const checkTimer = setTimeout(() => {
      // Logic for debounced duplicate check will be handled in formField callbacks or a separate watcher
    }, 500);
    return () => clearTimeout(checkTimer);
  }, []);

  const handleLiveDuplicateCheck = async (branch, mobile, email) => {
    if (!branch || (!mobile && !email)) {
      setLiveDuplicate(null);
      return;
    }
    
    // Only check if valid formats
    const isMobileValid = /^[0-9]{10}$/.test(mobile);
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (!isMobileValid && !isEmailValid) {
      setLiveDuplicate(null);
      return;
    }

    try {
      setCheckingDuplicate(true);
      const result = await enquiryApi.checkDuplicate(branch, mobile, email);
      if (result.success && result.exists) {
        setLiveDuplicate(result.enquiry);
      } else {
        setLiveDuplicate(null);
      }
    } catch (err) {
      console.error('Live duplicate check failed:', err);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleCapturePhoto = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file);
      const fd = new FormData();
      fd.append('photo', compressedFile);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/profile-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const result = await res.json();
      if (result.success) {
        setPaymentData(prev => ({ ...prev, profilePhoto: result.data.url }));
      } else {
        alert(result.message || 'Capture failed');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process captured photo');
    } finally {
      setUploadingPhoto(false);
      setShowCamera(false);
    }
  };

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
        fetchPlanCategories(),
        fetchEmployees()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      if (!hasCache) setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      const employeeData = response.data || response || [];
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
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
    const initialData = {
      planCategory: enquiry.plan?.category?._id || enquiry.plan?.category || '',
      plan: enquiry.plan?._id || '',
      taxSlab: '',
      discountPercentage: 0,
      paymentReceived: 0,
      paymentRemaining: 0,
      membershipStartDate: new Date(),
      membershipEndDate: null,
      nextPaymentDate: null,
      profilePhoto: enquiry.profilePhoto || ''
    };
    setDiscountType('percentage');
    setDiscountWarning('');
    setDiscountInputValue(0);
    setPaymentData(recalcRemaining(initialData));
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
    if (submittingFollowUp) return;
    if (!followUpData.note.trim()) return alert('Note is required');
    try {
      setSubmittingFollowUp(true);
      await followupApi.create({
        enquiry: selectedEnquiryForFollowUp._id,
        note: followUpData.note,
        followUpDate: formatLocalDate(followUpData.followUpDate),
        followUpTime: followUpData.followUpTime || null
      });

      alert('✅ Follow-up added successfully!');
      setShowFollowUpModal(false);
      setSelectedEnquiryForFollowUp(null);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
    } catch (error) {
      console.error('Error adding follow-up:', error);
      alert('❌ Failed to add follow-up. Please try again.');
    } finally {
      setSubmittingFollowUp(false);
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

  // Recalculate remaining and end date whenever any billing field or start date changes
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
      membershipEndDate: calculatedEndDate,
      // Auto-clear next payment date if balance is 0
      nextPaymentDate: remaining > 0 ? updatedData.nextPaymentDate : null
    };
  };

  const handlePaymentChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setPaymentData(prev => recalcRemaining({ ...prev, paymentReceived: '' }));
      return;
    }
    let received = parseFloat(val) || 0;
    if (received < 0) received = 0;

    // Clamp to conversion total
    const billing = getBillingBreakdown();
    if (received > billing.total) received = billing.total;

    setPaymentData(prev => recalcRemaining({ ...prev, paymentReceived: received }));
  };

  const handleDiscountTypeChange = (e) => {
    const type = e.target.value;
    setDiscountType(type);
    setDiscountWarning('');
    setDiscountInputValue(0);
    setPaymentData(prev => recalcRemaining({ ...prev, discountPercentage: 0 }));
  };

  const handleDiscountChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setDiscountInputValue('');
      setDiscountWarning('');
      setPaymentData(prev => recalcRemaining({ ...prev, discountPercentage: 0 }));
      return;
    }

    let inputVal = parseFloat(val) || 0;
    if (inputVal < 0) inputVal = 0;

    const selectedPlan = plans.find(p => p._id === paymentData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;

    let finalDiscountPct = 0;
    let warning = '';

    if (discountType === 'percentage') {
      if (inputVal > 100) inputVal = 100;
      
      if (!noDiscountLimit && inputVal > maxDiscountPercentage) {
        warning = `⚠️ You can only apply up to ${maxDiscountPercentage}% discount (per your designation)`;
        finalDiscountPct = maxDiscountPercentage;
      } else {
        finalDiscountPct = inputVal;
      }
      setDiscountInputValue(inputVal);
    } else {
      // Flat Value mode
      if (paymentData.plan) {
        const maxAllowedAmt = Math.round((planAmount * maxDiscountPercentage) / 100);
        
        if (!noDiscountLimit && inputVal > maxAllowedAmt) {
          warning = `⚠️ You can only apply up to ₹${maxAllowedAmt} discount (${maxDiscountPercentage}% of plan price)`;
          inputVal = maxAllowedAmt;
        } else if (inputVal > planAmount) {
          inputVal = planAmount;
        }
        
        finalDiscountPct = planAmount > 0 ? (inputVal / planAmount) * 100 : 0;
      } else {
        // No plan yet, we'll validate when plan is chosen
        finalDiscountPct = 0;
      }
      setDiscountInputValue(inputVal);
    }

    setDiscountWarning(warning);
    setPaymentData(prev => recalcRemaining({ ...prev, discountPercentage: finalDiscountPct }));
  };

  const handlePlanChangeInPayment = (e) => {
    const planId = e.target.value;
    const selectedPlan = plans.find(p => p._id === planId);
    const planAmount = selectedPlan ? selectedPlan.price : 0;

    let updatedData = { ...paymentData, plan: planId, planCategory: paymentData.planCategory };
    
    // Re-validate flat discount if plan changes
    if (discountType === 'value' && discountInputValue > 0) {
      let inputVal = discountInputValue;
      let warning = '';
      const maxAllowedAmt = Math.round((planAmount * maxDiscountPercentage) / 100);

      if (!noDiscountLimit && inputVal > maxAllowedAmt) {
        warning = `⚠️ Discount adjusted to ₹${maxAllowedAmt} (max ${maxDiscountPercentage}% for this plan)`;
        inputVal = maxAllowedAmt;
      } else if (inputVal > planAmount) {
        inputVal = planAmount;
      }

      setDiscountInputValue(inputVal);
      setDiscountWarning(warning);
      updatedData.discountPercentage = planAmount > 0 ? (inputVal / planAmount) * 100 : 0;
    }

    setPaymentData(prev => recalcRemaining(updatedData));
  };

  const handleTaxSlabChange = (e) => {
    const slabId = e.target.value;
    setPaymentData(prev => recalcRemaining({ ...prev, taxSlab: slabId }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentData.plan || (paymentData.paymentReceived === '' || paymentData.paymentReceived <= 0)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmittingConvert(true);

      const billing = getBillingBreakdown();

      const memberData = {
        name: selectedEnquiry.name,
        email: selectedEnquiry.email,
        mobileNumber: selectedEnquiry.mobileNumber,
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
        paymentReceived: paymentData.paymentReceived === '' ? 0 : Number(paymentData.paymentReceived),
        paymentRemaining: paymentData.paymentRemaining,
        status: 'active',
        membershipStartDate: paymentData.membershipStartDate.toISOString(),
        membershipEndDate: paymentData.membershipEndDate ? paymentData.membershipEndDate.toISOString() : null,
        nextPaymentDate: paymentData.nextPaymentDate ? paymentData.nextPaymentDate.toISOString() : null,
        enquiryId: selectedEnquiry._id,
        profilePhoto: paymentData.profilePhoto || selectedEnquiry.profilePhoto || null
      };

      console.log('Sending member data:', memberData);

      console.log('Member created:', response);
      console.log('📄 Receipt keys:', { hasBuffer: !!response.receiptBuffer, hasFilename: !!response.receiptFilename });

      // 📥 Automatic Download of Receipt
      if (response.receiptBuffer && response.receiptFilename) {
        try {
          const byteCharacters = atob(response.receiptBuffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
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

      await enquiryApi.update(selectedEnquiry._id, { status: 'converted' });

      alert('✅ Enquiry converted to Member successfully!');
      setShowPaymentModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error converting to member:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`❌ Failed to convert to member: ${errorMessage}`);
    } finally {
      setSubmittingConvert(false);
    }
  };

  const handleDuplicateFound = (existingEnquiry) => {
    console.log('⚠️ Duplicate found in EnquiryMaster:', existingEnquiry);
    setDuplicateData(existingEnquiry);
    setShowDuplicateModal(true);
  };

  const handleReopenFromDuplicate = async () => {
    if (!duplicateData) return;
    try {
      setSubmittingReopen(true);
      await enquiryApi.reopen(duplicateData._id);
      alert('✅ Enquiry reopened successfully! Redirecting to details...');
      setShowDuplicateModal(false);
      navigate(`/enquiry/${duplicateData._id}`);
    } catch (err) {
      alert('Failed to reopen: ' + err.message);
    } finally {
      setSubmittingReopen(false);
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
      label: 'Branch',
      field: 'branch',
      mobileHide: true,
      render: (item) => item.branch?.name || '-'
    },
    {
      label: 'Date',
      field: 'createdAt',
      render: (item) => {
        const d = new Date(item.createdAt);
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    },
    {
      label: 'Enquired By',
      field: 'createdBy',
      render: (item) => item.createdBy?.name || 'Unknown'
    },
    {
      label: 'Status',
      field: 'status',
      render: (item) => (
        <span className={`status-badge status-${(item.status || 'pending').toLowerCase()}`}>
          {item.status || 'Pending'}
        </span>
      ),
    }
  ];

  const formFields = React.useMemo(() => [
    {
      name: 'branch',
      label: 'Branch',
      type: 'select',
      required: true,
      options: isAdmin
        ? [
            { value: '', label: 'Select Branch' },
            ...branches.map(b => ({
              value: b._id,
              label: b.name
            }))
          ]
        : branches
            .filter(b => userBranches.includes(b._id))
            .map(b => ({ value: b._id, label: b.name })),
      ...((!isAdmin && userBranches.length === 1) ? { defaultValue: userBranches[0], disabled: true } : {}),
      onChange: (val, formData, setFormData) => {
        setFormData({ ...formData, branch: val });
        handleLiveDuplicateCheck(val, formData.mobileNumber, formData.email);
      }
    },
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name',
      errorText: (formData) => {
        if (!formData.name) return null;
        if (formData.name.trim().length < 2) return '❌ Name must be at least 2 characters';
        if (/[0-9]/.test(formData.name)) return '❌ Name should not contain numbers';
        return null;
      }
    },
    {
      name: 'mobileNumber',
      label: 'Mobile Number',
      type: 'tel',
      required: true,
      placeholder: 'Enter 10-digit mobile number',
      onChange: (val, formData, setFormData) => {
        const numericVal = val.replace(/[^0-9]/g, '').slice(0, 10);
        setFormData({ ...formData, mobileNumber: numericVal });
        if (numericVal.length === 10) {
          handleLiveDuplicateCheck(formData.branch, numericVal, formData.email);
        } else {
          setLiveDuplicate(null);
        }
      },
      errorText: (formData) => {
        if (!formData.mobileNumber) return null;
        if (!/^[0-9]{10}$/.test(formData.mobileNumber)) return '❌ Mobile number must be exactly 10 digits';
        return null;
      },
      helperText: (formData) => {
        if (liveDuplicate && liveDuplicate.mobileNumber === formData.mobileNumber) {
          return (
            <div className="field-helper">
              <div className="field-helper-text">
                <span>⚠️ This mobile number is already registered in our system.</span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Force hard navigation to ensure modal state is cleared
                  window.location.href = `/enquiry/${liveDuplicate._id}`;
                }} 
                className="field-helper-btn"
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View Existing Enquiry
              </button>
            </div>
          );
        }
        return null;
      }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: false,
      placeholder: 'Enter email address',
      onChange: (val, formData, setFormData) => {
        setFormData({ ...formData, email: val });
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          handleLiveDuplicateCheck(formData.branch, formData.mobileNumber, val);
        } else {
          setLiveDuplicate(null);
        }
      },
      errorText: (formData) => {
        if (!formData.email) return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return '❌ Invalid email format';
        return null;
      },
      helperText: (formData) => {
        if (liveDuplicate && liveDuplicate.email?.toLowerCase() === formData.email?.toLowerCase()) {
          return (
            <div className="field-helper">
              <div className="field-helper-text">
                <span>⚠️ This email address is already registered in our system.</span>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Force hard navigation to ensure modal state is cleared
                  window.location.href = `/enquiry/${liveDuplicate._id}`;
                }} 
                className="field-helper-btn"
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View Existing Enquiry
              </button>
            </div>
          );
        }
        return null;
      }
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
  ], [branches, liveDuplicate]);

  const filterConfig = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Status', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'Converted', value: 'converted' },
        { label: 'Lost', value: 'lost' },
      ]
    },
    ...(isAdmin ? [{
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
    }] : []),
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
      name: 'createdBy',
      label: 'Enquiry Created By',
      type: 'select',
      options: [
        { value: '', label: 'All Users' },
        ...employees.map(e => ({ value: e._id, label: e.name }))
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

  const handleMarkAsLost = async (item) => {
    if (window.confirm(`Are you sure you want to mark enquiry for "${item.name}" as LOST? This cannot be undone.`)) {
      try {
        await enquiryApi.update(item._id, { status: 'lost' });
        alert('📉 Enquiry marked as LOST');
        setRefreshKey(prev => prev + 1);
        fetchStats();
      } catch (error) {
        console.error('Error marking as lost:', error);
        alert('Failed to mark as lost: ' + (error.response?.data?.message || error.message));
      }
    }
  };

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
        <div 
          className={`stat-card total ${activeStatusFilter === '' ? 'active' : ''}`} 
          onClick={() => setActiveStatusFilter('')} 
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.total || 0}</h3>
            <p>Total Enquiries</p>
          </div>
        </div>
        <div 
          className={`stat-card pending ${activeStatusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveStatusFilter('pending')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending || 0}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div 
          className={`stat-card converted ${activeStatusFilter === 'converted' ? 'active' : ''}`}
          onClick={() => setActiveStatusFilter('converted')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.converted || 0}</h3>
            <p>Converted</p>
          </div>
        </div>
        <div 
          className={`stat-card lost ${activeStatusFilter === 'lost' ? 'active' : ''}`}
          onClick={() => setActiveStatusFilter('lost')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3>{stats.lost || 0}</h3>
            <p>Lost</p>
          </div>
        </div>
      </div>

      <GenericMaster
        title="Enquiry Master"
        apiService={enquiryApi}
        onRowClick={(item) => navigate(`/enquiry/${item._id}`)}
        columns={columns}
        formFields={formFields}
        filterConfig={filterConfig}
        searchPlaceholder="Search by name, mobile, email, or enquiry ID..."
        icon="👥"
        showCreateButton={can('createEnquiry')}
        showActionsColumn={false}
        refreshKey={refreshKey}
        exportFileName="enquiries"
        onDuplicateFound={handleDuplicateFound}
        externalFilters={externalFilters}
      />

      {/* ✅ DUPLICATE ENQUIRY DIALOG */}
      {showDuplicateModal && duplicateData && (
        <div className="modal-overlay" onClick={() => setShowDuplicateModal(false)}>
          <div className="modal-content duplicate-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: '#f59e0b' }}>
              <h2 style={{ color: 'white' }}>⚠️ Entry Already Exists</h2>
              <button className="btn-close" onClick={() => setShowDuplicateModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="duplicate-alert" style={{ 
                background: '#fffbeb', 
                border: '1px solid #fde68a', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                color: '#92400e'
              }}>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  An enquiry with this mobile number or email already exists in this branch.
                </p>
              </div>

              <div className="existing-enquiry-info" style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#1e293b' }}>Existing Record Details:</h3>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <p style={{ margin: 0 }}><strong>Name:</strong> {duplicateData.name}</p>
                  <p style={{ margin: 0 }}><strong>ID:</strong> {duplicateData.enquiryId}</p>
                  <p style={{ margin: 0 }}><strong>Plan:</strong> {duplicateData.plan?.planName || 'Not Selected'}</p>
                  <p style={{ margin: 0 }}>
                    <strong>Status:</strong> 
                    <span className={`status-badge status-${duplicateData.status}`} style={{ marginLeft: '8px' }}>
                      {duplicateData.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => setShowDuplicateModal(false)} style={{ border: '1px solid #cbd5e1', padding: '0.6rem 1rem', borderRadius: '6px' }}>
                Cancel
              </button>
              
              <button 
                className="btn-view" 
                onClick={() => navigate(`/enquiry/${duplicateData._id}`)}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600' }}
              >
                👁️ View Enquiry
              </button>

              {duplicateData.status === 'pending' && can('convertToMember') && (
                <button 
                  className="btn-convert" 
                  onClick={() => {
                    handleConvertToMember(duplicateData);
                    setShowDuplicateModal(false);
                  }}
                  style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600' }}
                >
                  ✅ Convert to Member
                </button>
              )}

              {duplicateData.status === 'lost' && (
                <button 
                  className="btn-reopen" 
                  onClick={handleReopenFromDuplicate}
                  disabled={submittingReopen}
                  style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600' }}
                >
                  {submittingReopen ? '⏳ Reopening...' : '🔄 Reopen Enquiry'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div className="profile-photo-upload-section" style={{ flexShrink: 0 }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      border: '3px dashed #cbd5e1',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#fff',
                      position: 'relative',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {uploadingPhoto ? (
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.7rem' }}>⏳...</div>
                      ) : paymentData.profilePhoto ? (
                        <img
                          src={paymentData.profilePhoto}
                          alt="Profile"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '2rem' }}>👤</div>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      marginTop: '0.5rem'
                    }}>
                      <button 
                        type="button"
                        onClick={() => setShowCamera(true)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'center',
                          color: '#10b981',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '4px',
                          border: '1px solid #10b981',
                          borderRadius: '4px',
                          background: 'white'
                        }}>
                        📷 {uploadingPhoto ? 'Processing...' : 'Take Photo'}
                      </button>
                      <label style={{
                        display: 'block',
                        textAlign: 'center',
                        color: '#6366f1',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '4px',
                        border: '1px solid #6366f1',
                        borderRadius: '4px'
                      }}>
                        📁 {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingPhoto(true);
                            try {
                              const compressedFile = await compressImage(file);
                              const fd = new FormData();
                              fd.append('photo', compressedFile);
                              const token = localStorage.getItem('token');
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/profile-photo`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: fd
                              });
                              const result = await res.json();
                              if (result.success) {
                                setPaymentData(prev => ({ ...prev, profilePhoto: result.data.url }));
                              } else {
                                alert(result.message || 'Upload failed');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Failed to upload');
                            } finally {
                              setUploadingPhoto(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>Enquiry Details</h3>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}><strong>Name:</strong> {selectedEnquiry?.name}</p>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}><strong>Mobile:</strong> {selectedEnquiry?.mobileNumber}</p>
                    <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}><strong>Email:</strong> {selectedEnquiry?.email}</p>
                  </div>
                </div>

                <div className="responsive-form-grid" style={{ marginBottom: '1.5rem' }}>
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
                </div>

                <div className="form-group">
                  <label>Membership Start Date <span className="required">*</span></label>
                  <DatePicker
                    selected={paymentData.membershipStartDate}
                    onChange={(date) => setPaymentData(prev => recalcRemaining({ ...prev, membershipStartDate: date }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select start date"
                    required
                    className="custom-datepicker"
                    wrapperClassName="datepicker-wrapper"
                    minDate={isAdmin ? undefined : new Date()}
                  />
                </div>

                <div className="form-group">
                  <label>Membership End Date</label>
                  <DatePicker
                    selected={paymentData.membershipEndDate}
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

                {/* Discount - only shown if user has noDiscountLimit permission */}
                {/* Discount Section */}
                {(isAdmin || noDiscountLimit || maxDiscountPercentage > 0) && (
                  <div className="responsive-form-grid">
                    <div className="form-group">
                      <label>Discount Type</label>
                      <select value={discountType} onChange={handleDiscountTypeChange}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="value">Flat Value (₹)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        Discount {discountType === 'percentage' ? '%' : '(₹)'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={discountInputValue}
                          onChange={handleDiscountChange}
                          placeholder={discountType === 'percentage' ? '0-100' : 'Enter amount'}
                          min="0"
                        />
                        <span style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                          fontSize: '0.9rem',
                          pointerEvents: 'none'
                        }}>
                          {discountType === 'percentage' ? '%' : '₹'}
                        </span>
                      </div>
                      {!noDiscountLimit && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          Max allowed: {discountType === 'percentage' 
                            ? `${maxDiscountPercentage}%` 
                            : `₹${Math.round((plans.find(p => p._id === paymentData.plan)?.price || 0) * maxDiscountPercentage / 100)}`}
                        </p>
                      )}
                      {discountWarning && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#f59e0b', fontWeight: '500' }}>
                          {discountWarning}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Payment Received <span className="required">*</span></label>
                  <input
                    type="number"
                    value={paymentData.paymentReceived}
                    onChange={handlePaymentChange}
                    required
                    placeholder="Enter amount received"
                  />
                </div>

                <div className="responsive-form-grid">
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

                  {paymentData.paymentRemaining > 0 && (
                    <div className="form-group">
                      <label>Next Payment Date <span className="required">*</span></label>
                      <DatePicker
                        selected={paymentData.nextPaymentDate}
                        onChange={(date) => setPaymentData(prev => ({ ...prev, nextPaymentDate: date }))}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select date"
                        required
                        minDate={new Date()}
                        className="custom-datepicker"
                        wrapperClassName="datepicker-wrapper"
                      />
                    </div>
                  )}
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
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={submittingConvert}
                  style={{
                    background: submittingConvert ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    cursor: submittingConvert ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submittingConvert ? '⏳ Generating Payment Slip...' : '✅ Convert to Member'}
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
                  disabled={submittingFollowUp}
                  style={{
                    background: 'white',
                    color: '#10b981',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: submittingFollowUp ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {submittingFollowUp ? '⏳ Saving...' : '💾 Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Camera Capture Modal */}
      <CameraModal 
        isOpen={showCamera} 
        onClose={() => setShowCamera(false)} 
        onCapture={handleCapturePhoto}
      />
    </div>
  );
};

export default EnquiryMaster;
