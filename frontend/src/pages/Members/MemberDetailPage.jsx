import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SkeletonLoader from '../../components/SkeletonLoader';
import { 
  User, 
  CreditCard, 
  Clock, 
  MessageSquare, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Heart, 
  Share2,
  Plus,
  Loader2,
  Edit,
  History,
  Wallet,
  RefreshCw,
  AlertCircle,
  X,
  CreditCard as CardIcon
} from 'lucide-react';
import memberApi from '../../services/memberApi';
import followupApi from '../../services/followupApi';
import planApi from '../../services/planApi';
import { taxSlabAPI, planCategoryAPI, paymentTypeAPI, employeeAPI } from '../../services/mastersApi';
import { formatLocalDate } from '../../utils/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import GenericMaster from '../../components/Masters/GenericMaster';
import './MemberDetailPage.css';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Instant render: try to get member data from router state (passed from GenericMaster)
  const [member, setMember] = useState(location.state?.item || null);
  const [followups, setFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('contact'); // 'contact', 'plan', 'history', 'followups'
  
  // States for Master Data (Dropdowns)
  const [plans, setPlans] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [planCategories, setPlanCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('UPI');

  // Modal Visibility States
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form Submission States
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingRenewal, setSubmittingRenewal] = useState(false);

  // Payment Form State
  const [additionalPayment, setAdditionalPayment] = useState(0);

  // Renewal Form State
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'value'
  const [discountWarning, setDiscountWarning] = useState('');
  const [discountInputValue, setDiscountInputValue] = useState(0);
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  
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

  // If we already have member data from state, we don't need a full-page loading block
  const [loading, setLoading] = useState(!member);
  const [error, setError] = useState(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState('plans');
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => {
    fetchMemberData();
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [pCats, pData, slabs, modes, userResp] = await Promise.all([
        planCategoryAPI.getAll(),
        planApi.getAll(),
        taxSlabAPI.getAll(),
        paymentTypeAPI.getAll(),
        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ]);

      if (pCats.data) setPlanCategories(pCats.data.filter(c => c.status === 'active'));
      if (pData.data) setPlans(pData.data.filter(p => p.status === 'active'));
      if (slabs.data) setTaxSlabs(slabs.data.filter(s => s.status === 'active'));
      
      if (modes.data) {
        const activeModes = modes.data.filter(m => m.status === 'active');
        setPaymentModes(activeModes);
        const hasUPI = activeModes.find(m => m.paymentType.toUpperCase() === 'UPI');
        setSelectedPaymentMode(hasUPI ? hasUPI.paymentType : (activeModes[0]?.paymentType || 'UPI'));
      }

      if (userResp.success && userResp.data) {
        setMaxDiscountPercentage(userResp.data.maxDiscountPercentage || 0);
        setNoDiscountLimit(userResp.data.noDiscountLimit || false);
      }
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'followups') {
      fetchFollowups();
    }
    if (activeTab === 'history') {
      fetchHistoryData();
    }
  }, [activeTab]);

  const fetchHistoryData = async () => {
    try {
      setHistoryLoading(true);
      const resp = await memberApi.getHistory(id);
      if (resp.success) {
        setHistoryData(resp.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      const response = await memberApi.getById(id);
      if (response.success) {
        setMember(response.data);
      } else {
        setError('Member not found');
      }
    } catch (err) {
      console.error('Error fetching member:', err);
      setError('Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowups = async () => {
    try {
      const response = await followupApi.getByMember(id);
      if (response && response.success) {
        setFollowups(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    }
  };

  const downloadReceipt = async (payment, index) => {
    try {
      setLoading(true); // Short loading for feedback
      const response = await memberApi.getPaymentReceipt(id, index);
      
      if (response.success && response.receiptBuffer) {
          const byteCharacters = atob(response.receiptBuffer);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.receiptFilename || `${member.name}_Receipt.pdf`;
          link.click();
          URL.revokeObjectURL(url);
      } else {
        throw new Error('Receipt data not available');
      }
    } catch (err) {
      console.error('Failed to download receipt:', err);
      alert('❌ Error: ' + (err.message || 'Failed to generate receipt. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpData.note) return alert('Please enter a note');
    try {
      const payload = {
        member: id,
        note: followUpData.note,
        followUpDate: formatLocalDate(followUpData.followUpDate),
        followUpTime: followUpData.followUpTime,
        status: 'pending'
      };
      await followupApi.create(payload);
      setShowFollowUpModal(false);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
      fetchFollowups();
      alert('✅ Follow-up added successfully!');
    } catch (err) {
      alert('Failed to add follow-up: ' + err.message);
    }
  };

  // --- RENEWAL LOGIC ---
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

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewData.plan || !renewData.membershipStartDate || !renewData.membershipEndDate) {
      return alert('Please fill all required fields');
    }

    try {
      setSubmittingRenewal(true);
      const billing = getRenewBillingBreakdown();
      const updateData = {
        plan: renewData.plan,
        membershipStartDate: renewData.membershipStartDate.toISOString(),
        membershipEndDate: renewData.membershipEndDate.toISOString(),
        status: 'active',
        planAmount: billing.planAmount,
        discountPercentage: billing.discountPct,
        discountAmount: billing.discountAmt,
        taxPercentage: billing.taxPct,
        taxAmount: billing.taxAmt,
        totalAmount: billing.total,
        paymentReceived: (member.paymentReceived || 0) + (renewData.paymentReceived === '' ? 0 : Number(renewData.paymentReceived)),
        paymentRemaining: renewData.paymentRemaining,
        taxSlab: renewData.taxSlab || null
      };

      const response = await memberApi.update(id, updateData);
      
      // Auto-download receipt if available
      if (response.receiptBuffer && response.receiptFilename) {
        handleReceiptDownload(response.receiptBuffer, response.receiptFilename);
      }

      alert('✅ Member plan renewed successfully!');
      setShowRenewModal(false);
      fetchMemberData(); // Refresh page data
    } catch (err) {
      alert(`❌ Failed to renew: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingRenewal(false);
    }
  };

  const handleReceiptDownload = (buffer, filename) => {
    try {
      const byteCharacters = atob(buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Receipt download failed:', err);
    }
  };

  // --- PAYMENT LOGIC ---
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (additionalPayment <= 0) return alert('Please enter a valid amount');

    try {
      setSubmittingPayment(true);
      const response = await memberApi.update(id, {
        additionalPayment: Number(additionalPayment),
        paymentMode: selectedPaymentMode
      });

      if (response.receiptBuffer && response.receiptFilename) {
        handleReceiptDownload(response.receiptBuffer, response.receiptFilename);
      }

      alert('✅ Payment added successfully!');
      setShowPaymentModal(false);
      setAdditionalPayment(0);
      fetchMemberData();
    } catch (err) {
      alert('❌ Failed to add payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // --- EDIT LOGIC ---
  const handleEditOpen = () => {
    setShowEditModal(true);
  };

  const handleEditComplete = () => {
    setShowEditModal(false);
    fetchMemberData();
  };

  const handleRenewPlanChange = (e) => {
    const planId = e.target.value;
    const selectedPlan = plans.find(p => p._id === planId);
    const planAmount = selectedPlan ? selectedPlan.price : 0;

    let updatedData = { ...renewData, plan: planId };
    
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

    setRenewData(prev => recalcRenewData(updatedData));
  };

  const handleRenewDiscountChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setDiscountInputValue('');
      setDiscountWarning('');
      setRenewData(prev => recalcRenewData({ ...prev, discountPercentage: 0 }));
      return;
    }

    let inputVal = parseFloat(val) || 0;
    if (inputVal < 0) inputVal = 0;

    const selectedPlan = plans.find(p => p._id === renewData.plan);
    const planAmount = selectedPlan ? selectedPlan.price : 0;

    let finalDiscountPct = 0;
    let warning = '';

    if (discountType === 'percentage') {
      if (inputVal > 100) inputVal = 100;
      
      if (!noDiscountLimit && inputVal > maxDiscountPercentage) {
        warning = `⚠️ You can only apply up to ${maxDiscountPercentage}% discount`;
        finalDiscountPct = maxDiscountPercentage;
      } else {
        finalDiscountPct = inputVal;
      }
      setDiscountInputValue(inputVal);
    } else {
      if (renewData.plan) {
        const maxAllowedAmt = Math.round((planAmount * maxDiscountPercentage) / 100);
        if (!noDiscountLimit && inputVal > maxAllowedAmt) {
          warning = `⚠️ You can only apply up to ₹${maxAllowedAmt} discount`;
          inputVal = maxAllowedAmt;
        } else if (inputVal > planAmount) {
          inputVal = planAmount;
        }
        finalDiscountPct = planAmount > 0 ? (inputVal / planAmount) * 100 : 0;
      }
      setDiscountInputValue(inputVal);
    }

    setDiscountWarning(warning);
    setRenewData(prev => recalcRenewData({ ...prev, discountPercentage: finalDiscountPct }));
  };

  const handleRenewPaymentChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setRenewData(prev => recalcRenewData({ ...prev, paymentReceived: '' }));
      return;
    }
    let received = parseFloat(val) || 0;
    if (received < 0) received = 0;
    
    // Clamp to renewal total
    const billing = getRenewBillingBreakdown();
    if (received > billing.total) received = billing.total;
    
    setRenewData(prev => recalcRenewData({ ...prev, paymentReceived: received }));
  };

  const handleRenewMemberOpen = () => {
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
    setDiscountType('percentage');
    setDiscountWarning('');
    setDiscountInputValue(0);
    setRenewData(recalcRenewData(initialRenewData));
    setShowRenewModal(true);
  };

  const handlePaymentOpen = () => {
    setAdditionalPayment(0);
    const hasUPI = paymentModes.find(m => m.paymentType.toUpperCase() === 'UPI');
    setSelectedPaymentMode(hasUPI ? hasUPI.paymentType : (paymentModes[0]?.paymentType || 'UPI'));
    setShowPaymentModal(true);
  };

  if (loading && !member) return (
    <SkeletonLoader variant="member-detail" />
  );
  if (error) return (
    <div className="error-card-container">
      <div className="error-card">
        <div className="error-icon-wrapper">
          <AlertCircle size={32} />
        </div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button className="btn-retry" onClick={fetchMemberData}>
            <RefreshCw size={18} /> Retry
          </button>
          <button className="btn-go-back" onClick={() => navigate('/members')}>
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
  if (!member) return null;

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
  const formatMonthYear = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';

  return (
    <div className="member-detail-page">
      {/* Header Bar */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/members')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Member Details</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-banner"></div>
        <div className="profile-info-container">
          <div className="avatar-circle">
            {member.profilePhoto ? (
              <img src={member.profilePhoto} alt={member.name} />
            ) : (
              <span>{member.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
            )}
          </div>
          <div className="profile-name-section">
            <div className="name-row">
              <h2>{member.name}</h2>
              <span className={`status-tag status-${member.status}`}>
                {member.status}
              </span>
            </div>
            <p className="member-since">Member since {formatMonthYear(member.createdAt || member.membershipStartDate)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <button className="action-btn edit" onClick={handleEditOpen}>
          <Edit size={18} />
          Edit Profile
        </button>
        <button className="action-btn payment" onClick={handlePaymentOpen}>
          <Wallet size={18} />
          Add Payment
        </button>
        <button className="action-btn renew" onClick={handleRenewMemberOpen}>
          <RefreshCw size={18} />
          Renew
        </button>
        <button 
          className="action-btn history" 
          onClick={() => {
            setActiveTab('history');
            const historyEl = document.querySelector('.tabs-container');
            if (historyEl) historyEl.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <History size={18} />
          Full History
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <div 
          className={`tab-item ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
          title="Contact Info"
        >
          <User size={24} />
        </div>
        <div 
          className={`tab-item ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
          title="Current Plan"
        >
          <CreditCard size={24} />
        </div>
        <div 
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="History"
        >
          <Clock size={24} />
        </div>
        <div 
          className={`tab-item ${activeTab === 'followups' ? 'active' : ''}`}
          onClick={() => setActiveTab('followups')}
          title="Follow-ups"
        >
          <MessageSquare size={24} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'contact' && (
          <div className="contact-info">
            <h3 className="section-title">CONTACT INFORMATION</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-icon"><Mail size={22} /></div>
                <div className="info-text">
                  <label>Email</label>
                  <p>{member.email}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><Phone size={22} /></div>
                <div className="info-text">
                  <label>Phone</label>
                  <p>{member.mobileNumber}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><User size={22} /></div>
                <div className="info-text">
                  <label>Gender</label>
                  <p>{member.gender}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Share2 size={22} /></div>
                <div className="info-text">
                  <label>Enquiry Created By</label>
                  <p>{member.enquiryId?.createdBy?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><User size={22} /></div>
                <div className="info-text">
                  <label>Converted By</label>
                  <p>{member.convertedBy?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="plan-section">
            <div className="current-plan-card">
              <div className="plan-card-header">
                <h3>Current Plan</h3>
                <span className={`status-tag status-${member.status}`}>{member.status}</span>
              </div>
              <h2 className="plan-title">{member.plan?.planName || 'No Active Plan'}</h2>
              <div className="dates-row">
                <div className="date-item">
                  <label>Start Date</label>
                  <p className="start-date-text">{formatDate(member.membershipStartDate)}</p>
                </div>
                <div className="date-item">
                  <label>End Date</label>
                  <p className="end-date-text">{formatDate(member.membershipEndDate)}</p>
                </div>
              </div>
            </div>

            <div className="receipts-section">
              <h3 className="section-title">PAYMENT RECEIPTS</h3>
              <div className="receipts-list">
                {member.payments?.length > 0 ? (
                  [...member.payments].reverse().map((payment, revIdx) => {
                    const originalIndex = member.payments.length - 1 - revIdx;
                    
                    // 1. Find which cycle this payment belongs to
                    const pTime = new Date(payment.paymentDate).getTime();
                    let targetCycleIdx = -1;
                    if (member.history && member.history.length > 0) {
                      for (let j = 0; j < member.history.length; j++) {
                        if (pTime <= new Date(member.history[j].recordedAt).getTime()) {
                          targetCycleIdx = j;
                          break;
                        }
                      }
                    }

                    // 2. Determine cycle total amount
                    const cycleTotal = targetCycleIdx === -1 
                      ? (member.totalAmount || member.plan?.price || 0)
                      : (member.history[targetCycleIdx].totalAmount || member.history[targetCycleIdx].planAmount || 0);

                    // 3. Sum only payments for THIS cycle up to this index
                    let cumulativePaid = 0;
                    for (let i = 0; i <= originalIndex; i++) {
                      const iterTime = new Date(member.payments[i].paymentDate).getTime();
                      let iterCycleIdx = -1;
                      if (member.history && member.history.length > 0) {
                        for (let j = 0; j < member.history.length; j++) {
                          if (iterTime <= new Date(member.history[j].recordedAt).getTime()) {
                            iterCycleIdx = j;
                            break;
                          }
                        }
                      }
                      if (iterCycleIdx === targetCycleIdx) {
                        cumulativePaid += (member.payments[i].amount || 0);
                      }
                    }

                    const remainingAtThisPoint = Math.max(0, cycleTotal - cumulativePaid);

                    return (
                      <div className="receipt-item" key={originalIndex}>
                        <div className="receipt-details">
                          <h4>
                            {targetCycleIdx === -1 
                              ? (member.plan?.planName || 'Plan Receipt')
                              : (member.history[targetCycleIdx].plan?.planName || 'Previous Plan Receipt')
                            }
                          </h4>
                          <p>Date: {formatDate(payment.paymentDate)}</p>
                          <div className="amount-info">
                            <span className="paid-amount">Amount: ₹{payment.amount}</span>
                            {remainingAtThisPoint > 0 && (
                              <span className="remaining-tag">Remaining: ₹{remainingAtThisPoint}</span>
                            )}
                          </div>
                        </div>
                        <button className="share-btn" onClick={() => downloadReceipt(payment, originalIndex)}>
                          <Share2 size={18} /> Share
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-data-card">No payment history found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            {historyLoading ? (
              <div className="history-loading-inline">
                <Loader2 size={32} className="spinner" />
                <p>Loading timeline...</p>
              </div>
            ) : !historyData ? (
              <div className="no-data-card">No activity data found.</div>
            ) : (
              <>
                {/* Tab Switcher */}
                <div className="history-tabs">
                  <button 
                    className={`history-tab ${activeHistoryTab === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryTab('plans')}
                  >
                    📋 Plan History
                  </button>
                  <button 
                    className={`history-tab ${activeHistoryTab === 'payments' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryTab('payments')}
                  >
                    💰 All Payments
                  </button>
                </div>

                {activeHistoryTab === 'plans' ? (
                  <div className="history-plans-view">
                    <div className="section-label">Membership Plan Journey</div>
                    
                    {/* Current active plan at the top */}
                    {historyData.currentPlan && (
                      <div className={`plan-history-card current ${expandedPlanId === 'current' ? 'expanded' : ''}`} 
                           onClick={() => setExpandedPlanId(expandedPlanId === 'current' ? null : 'current')}>
                        <div className="plan-card-top">
                          <div className="plan-info-main">
                            <div className="plan-badge current">ACTIVE</div>
                            <h4>{historyData.currentPlan?.plan?.planName || 'Current Plan'}</h4>
                            <p>{formatDate(historyData.currentPlan?.startDate)} → {formatDate(historyData.currentPlan?.endDate)}</p>
                          </div>
                          <div className="plan-financials">
                            <span className="due-amount">₹{historyData.currentPlan?.paymentRemaining} Pending</span>
                            <span className="expand-indicator">{expandedPlanId === 'current' ? '🔼' : '🔽'}</span>
                          </div>
                        </div>
                        
                        {expandedPlanId === 'current' && (
                          <div className="plan-details-expanded" onClick={(e) => e.stopPropagation()}>
                            <div className="detail-grid">
                              <div className="detail-box">
                                <label>Bill Amount</label>
                                <span>₹{historyData.currentPlan?.totalAmount}</span>
                              </div>
                              <div className="detail-box">
                                <label>Received</label>
                                <span className="success">₹{historyData.currentPlan?.paymentReceived}</span>
                              </div>
                            </div>
                            
                            <div className="nested-payments">
                              <h5>Payments for this cycle</h5>
                              {(() => {
                                const planPayments = (historyData.paymentHistory || []).filter(p => {
                                  const pDate = new Date(p.paymentDate);
                                  const sDate = new Date(historyData.currentPlan.startDate);
                                  return pDate >= sDate;
                                });
                                
                                if (planPayments.length === 0) return <p className="no-data-small">No payments recorded for this plan cycle.</p>;
                                
                                return (
                                  <div className="small-payment-list">
                                    {planPayments.map((p, pIdx) => (
                                      <div key={pIdx} className="small-payment-item">
                                        <div className="p-date-mode">
                                          <span className="p-date">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</span>
                                          <span className="p-mode">{p.paymentMode}</span>
                                        </div>
                                        <span className="p-amount success">+ ₹{p.amount}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Past plans from history */}
                    {(historyData.planHistory || []).length > 0 ? (
                      [...historyData.planHistory].reverse().map((pastPlan, idx) => {
                        const isExpanded = expandedPlanId === `past-${idx}`;
                        return (
                          <div key={idx} className={`plan-history-card past ${isExpanded ? 'expanded' : ''}`}
                               onClick={() => setExpandedPlanId(isExpanded ? null : `past-${idx}`)}>
                            <div className="plan-card-top">
                              <div className="plan-info-main">
                                <div className="plan-badge past">ARCHIVED</div>
                                <h4>{pastPlan.plan?.planName || 'Previous Plan'}</h4>
                                <p>{formatDate(pastPlan.membershipStartDate)} → {formatDate(pastPlan.membershipEndDate)}</p>
                              </div>
                              <div className="plan-financials">
                                <span className="status-label">{pastPlan.status}</span>
                                <span className="expand-indicator">{isExpanded ? '🔼' : '🔽'}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="plan-details-expanded" onClick={(e) => e.stopPropagation()}>
                                <div className="detail-grid">
                                  <div className="detail-box">
                                    <label>Billed</label>
                                    <span>₹{pastPlan.totalAmount}</span>
                                  </div>
                                  <div className="detail-box">
                                    <label>Collected</label>
                                    <span className="success">₹{pastPlan.paymentReceived}</span>
                                  </div>
                                </div>
                                
                                <div className="nested-payments">
                                  <h5>Cycle Payments</h5>
                                  {(() => {
                                    const pStart = new Date(pastPlan.membershipStartDate);
                                    const pEnd = new Date(pastPlan.membershipEndDate);
                                    const planPayments = (historyData.paymentHistory || []).filter(p => {
                                      const pDate = new Date(p.paymentDate);
                                      return pDate >= pStart && pDate <= pEnd;
                                    });
                                    
                                    if (planPayments.length === 0) return <p className="no-data-small">No separate payments recorded for this archive.</p>;
                                    
                                    return (
                                      <div className="small-payment-list">
                                        {planPayments.map((p, pIdx) => (
                                          <div key={pIdx} className="small-payment-item">
                                            <div className="p-date-mode">
                                              <span className="p-date">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</span>
                                              <span className="p-mode">{p.paymentMode}</span>
                                            </div>
                                            <span className="p-amount success">+ ₹{p.amount}</span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      !historyData.currentPlan && <div className="timeline-empty">No plan history found.</div>
                    )}
                  </div>
                ) : (
                  <div className="history-payments-view">
                    <div className="section-label">All Individual Payments</div>
                    {(historyData.paymentHistory || []).length > 0 ? (
                      <div className="payment-history-table-container">
                        <table className="payment-history-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Mode</th>
                              <th>By</th>
                              <th>Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...historyData.paymentHistory].reverse().map((p, pIdx) => (
                              <tr key={pIdx}>
                                <td className="white-space-nowrap">
                                  {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short'
                                  })}
                                </td>
                                <td className="amount-cell success">₹{p.amount}</td>
                                <td><span className="mode-tag">{p.paymentMode}</span></td>
                                <td>{p.recordedBy?.name || 'Staff'}</td>
                                <td className="note-cell">{p.note || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="timeline-empty">No payment records found.</div>
                    )}
                  </div>
                )}

                {/* Lifetime Summary */}
                <div className="history-summary-bar">
                  <div className="summary-item">
                    <label>Lifetime Billing</label>
                    <span>₹{(historyData.planHistory?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0) + (historyData.currentPlan?.totalAmount || 0)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Total Received</label>
                    <span className="success">₹{historyData.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="followup-section">
             <button className="add-followup-btn" onClick={() => setShowFollowUpModal(true)}>
              <Plus size={20} /> Add Follow-up
            </button>
            <div className="followup-list">
              {followups.length > 0 ? (
                followups.map((f, index) => (
                  <div className="followup-item" key={index}>
                    <div className="followup-card">
                      <div className="followup-header">
                        <div className="msg-icon-rounded">
                          <MessageSquare size={18} />
                        </div>
                        <p className="followup-note">{f.note}</p>
                      </div>
                      <div className="followup-footer">
                        <div className="followup-timestamp">
                          <Clock size={14} />
                          <span>{new Date(f.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {f.followUpDate && (
                          <div className="followup-next-badge">
                            Next: {new Date(f.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-card">No follow-ups recorded</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Add Follow-up</h2>
              <button className="btn-close" onClick={() => setShowFollowUpModal(false)}><X size={20} /></button>
            </div>
            <div className="form-content">
              <div className="form-group">
                <label>Note <span className="required">*</span></label>
                <textarea 
                  value={followUpData.note}
                  onChange={(e) => setFollowUpData({ ...followUpData, note: e.target.value })}
                  placeholder="What was discussed?"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Next Follow-up Date</label>
                <DatePicker
                  selected={followUpData.followUpDate}
                  onChange={(date) => setFollowUpData({ ...followUpData, followUpDate: date })}
                  dateFormat="dd/MM/yyyy"
                  className="form-input"
                  minDate={new Date()}
                  placeholderText="Select date"
                />
              </div>
              <div className="form-group">
                <label>Follow-up Time</label>
                <input 
                  type="time" 
                  value={followUpData.followUpTime || ''} 
                  onChange={(e) => setFollowUpData({ ...followUpData, followUpTime: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddFollowUp}>Save Follow-up</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Payment</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <div className="form-content">
              <div className="member-info-mini">
                <p><strong>Member:</strong> {member.fullName}</p>
                <p><strong>Remaining Balance:</strong> ₹{member.paymentRemaining}</p>
              </div>
              
              <div className="form-group">
                <label>Payment Amount <span className="required">*</span></label>
                <input 
                  type="number" 
                  value={additionalPayment}
                  onChange={(e) => setAdditionalPayment(e.target.value)}
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Payment Mode <span className="required">*</span></label>
                <select 
                  value={selectedPaymentMode} 
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                >
                  {paymentModes.map(mode => (
                    <option key={mode._id} value={mode.paymentType}>{mode.paymentType}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={handlePaymentSubmit}
                disabled={submittingPayment}
              >
                {submittingPayment ? <Loader2 className="animate-spin" size={18} /> : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal-content renew-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Renew Membership</h2>
              <button className="btn-close" onClick={() => setShowRenewModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleRenewSubmit}>
              <div className="form-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Plan Category <span className="required">*</span></label>
                    <select 
                      value={renewData.planCategory}
                      onChange={(e) => setRenewData(prev => recalcRenewData({ ...prev, planCategory: e.target.value, plan: '' }))}
                      required
                    >
                      <option value="">Select Category</option>
                      {planCategories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Plan <span className="required">*</span></label>
                    <select 
                      value={renewData.plan}
                      onChange={handleRenewPlanChange}
                      required
                      disabled={!renewData.planCategory}
                    >
                      <option value="">Select Plan</option>
                      {plans.filter(p => p.planCategory === renewData.planCategory).map(p => (
                        <option key={p._id} value={p._id}>{p.planName} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Start Date <span className="required">*</span></label>
                    <DatePicker
                      selected={renewData.membershipStartDate}
                      onChange={(date) => setRenewData(prev => recalcRenewData({ ...prev, membershipStartDate: date }))}
                      dateFormat="dd/MM/yyyy"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (Auto)</label>
                    <DatePicker
                      selected={renewData.membershipEndDate}
                      readOnly
                      dateFormat="dd/MM/yyyy"
                      className="form-input"
                      disabled
                    />
                  </div>
                </div>

                <div className="discount-preview">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Discount</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className={`btn-toggle ${discountType === 'percentage' ? 'active' : ''}`}
                        onClick={() => { setDiscountType('percentage'); setDiscountInputValue(0); setRenewData(prev => recalcRenewData({...prev, discountPercentage: 0})); }}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: discountType === 'percentage' ? '#10b981' : 'white', color: discountType === 'percentage' ? 'white' : '#64748b' }}
                      >
                        %
                      </button>
                      <button 
                        type="button" 
                        className={`btn-toggle ${discountType === 'value' ? 'active' : ''}`}
                        onClick={() => { setDiscountType('value'); setDiscountInputValue(0); setRenewData(prev => recalcRenewData({...prev, discountPercentage: 0})); }}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: discountType === 'value' ? '#10b981' : 'white', color: discountType === 'value' ? 'white' : '#64748b' }}
                      >
                        ₹
                      </button>
                    </div>
                  </div>
                  <div className="discount-input-group">
                    <div className="discount-input-wrapper">
                      <input 
                        type="number"
                        className="form-input"
                        placeholder={discountType === 'percentage' ? 'Percentage' : 'Amount'}
                        value={discountInputValue}
                        onChange={handleRenewDiscountChange}
                      />
                      <span className="discount-symbol">{discountType === 'percentage' ? '%' : '₹'}</span>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <select 
                        value={renewData.taxSlab}
                        onChange={(e) => setRenewData(prev => recalcRenewData({ ...prev, taxSlab: e.target.value }))}
                      >
                        <option value="">No Tax</option>
                        {taxSlabs.map(s => <option key={s._id} value={s._id}>{s.taxName} ({s.taxPercentage}%)</option>)}
                      </select>
                    </div>
                  </div>
                  {discountWarning && <div className="discount-warning-msg danger-text">{discountWarning}</div>}
                </div>

                <div className="form-group">
                  <label>Initial Payment (Today)</label>
                  <input 
                    type="number"
                    value={renewData.paymentReceived}
                    onChange={handleRenewPaymentChange}
                    placeholder="Enter amount paid today"
                  />
                </div>

                <div className="billing-summary">
                  {(() => {
                    const billing = getRenewBillingBreakdown();
                    return (
                      <>
                        <div className="billing-row">
                          <span>Plan Price:</span>
                          <span>₹{billing.planAmount}</span>
                        </div>
                        {billing.discountAmt > 0 && (
                          <div className="billing-row danger-text">
                            <span>Discount ({billing.discountPct}%):</span>
                            <span>-₹{billing.discountAmt}</span>
                          </div>
                        )}
                        <div className="billing-row">
                          <span>Subtotal:</span>
                          <span>₹{billing.subtotal}</span>
                        </div>
                        {billing.taxAmt > 0 && (
                          <div className="billing-row">
                            <span>Tax ({billing.taxPct}%):</span>
                            <span>+₹{billing.taxAmt}</span>
                          </div>
                        )}
                        <div className="billing-row total">
                          <span>Grand Total:</span>
                          <span>₹{billing.total}</span>
                        </div>
                        <div className="billing-row" style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                          <span>Remaining Balance:</span>
                          <span className={renewData.paymentRemaining > 0 ? 'danger-text' : 'success-text'}>₹{renewData.paymentRemaining}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowRenewModal(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={submittingRenewal}
                >
                  {submittingRenewal ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Edit Member Details</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '0.5rem' }}>
              <GenericMaster
                title=""
                api={memberApi}
                columns={[]} // Not needed as we only want the modal
                formFields={[]} // GenericMaster handles this via metadata
                autoEditItemId={id}
                onCloseModal={handleEditComplete}
                hideTable={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
