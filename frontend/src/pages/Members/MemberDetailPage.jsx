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
  Edit2,
  History,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import memberApi from '../../services/memberApi';
import followupApi from '../../services/followupApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import { taxSlabAPI, planCategoryAPI, paymentTypeAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import { formatLocalDate } from '../../utils/dateUtils';
import { compressImage } from '../../utils/compressImage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MemberDetailPage.css';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = usePermissions();

  // Instant render: try to get member data from router state (passed from GenericMaster)
  const [member, setMember] = useState(location.state?.item || null);
  const [followups, setFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('contact'); // 'contact', 'plan', 'history', 'followups'
  // If we already have member data from state, we don't need a full-page loading block
  const [loading, setLoading] = useState(!member);
  const [error, setError] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('plans');
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Metadata for inline forms
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [planCategories, setPlanCategories] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);

  // Modal Visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Form States
  const [editFormData, setEditFormData] = useState({});
  const [renewData, setRenewData] = useState({
    planCategory: '',
    plan: '',
    taxSlab: '',
    discountPercentage: 0,
    paymentReceived: 0,
    paymentRemaining: 0,
    membershipStartDate: new Date(),
    membershipEndDate: null,
    nextPaymentDate: null,
    paymentMode: ''
  });
  const [additionalPayment, setAdditionalPayment] = useState(0);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('UPI');
  const [paymentNextPayDate, setPaymentNextPayDate] = useState(null);

  // Discount settings (copied logic from MemberMaster)
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountInputValue, setDiscountInputValue] = useState(0);
  const [discountWarning, setDiscountWarning] = useState('');

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchMemberData();
    fetchMetadata();
  }, [id]);

  const fetchMetadata = async () => {
    try {
      const [b, p, t, r, pt] = await Promise.all([
        branchApi.getAll(),
        planApi.getAll(),
        taxSlabAPI.getAll(),
        planCategoryAPI.getAll(),
        paymentTypeAPI.getAll(),
      ]);
      
      const branchData = Array.isArray(b) ? b : (b.data || []);
      setBranches(branchData.filter(bar => bar.status === 'active'));
      
      const planData = p.data || [];
      setPlans(planData.filter(p => p.status === 'active'));
      
      setTaxSlabs((t.data || []).filter(s => s.status === 'active'));
      setPlanCategories((r.data || []).filter(c => c.status === 'active'));
      
      const modes = pt.data || [];
      setPaymentTypes(modes.filter(m => m.status === 'active'));
      
      if (modes.length > 0) {
        const hasUPI = modes.find(m => m.paymentType?.toUpperCase() === 'UPI');
        setSelectedPaymentMode(hasUPI ? hasUPI.paymentType : modes[0].paymentType);
      }

      await fetchCurrentUserDiscount();
    } catch (err) {
      console.error('Error fetching metadata:', err);
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
      }
    } catch (error) {
      console.error('Error fetching user discount:', error);
    }
  };

  // Billing Calculation Helpers
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
    if (submittingFollowUp) return; // Prevent duplicate clicks
    if (!followUpData.note) return alert('Please enter a note');
    try {
      setSubmittingFollowUp(true);
      const payload = {
        member: id,
        note: followUpData.note,
        followUpDate: formatLocalDate(followUpData.followUpDate),
        followUpTime: followUpData.followUpTime,
        status: 'pending'
      };
      
      if (editingFollowUpId) {
        // Edit mode — update existing follow-up
        await followupApi.update(editingFollowUpId, payload);
      } else {
        // Create mode — new follow-up
        await followupApi.create(payload);
      }
      
      setShowFollowUpModal(false);
      setEditingFollowUpId(null);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
      fetchFollowups();
    } catch (err) {
      alert('Failed to save follow-up: ' + err.message);
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleEditFollowUp = (followUp) => {
    setFollowUpData({
      note: followUp.note || '',
      followUpDate: followUp.followUpDate ? new Date(followUp.followUpDate) : null,
      followUpTime: followUp.followUpTime || ''
    });
    setEditingFollowUpId(followUp._id);
    setShowFollowUpModal(true);
  };

  const handleMarkFollowUpComplete = async (fuId) => {
    try {
      await followupApi.updateStatus(fuId, 'completed');
      fetchFollowups();
    } catch (err) {
      console.error('Error marking follow-up as complete:', err);
      alert('Failed to update status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await memberApi.update(id, editFormData);
      alert('✅ Member details updated successfully!');
      setShowEditModal(false);
      fetchMemberData();
    } catch (err) {
      alert('Failed to update member: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewData.plan || !renewData.membershipStartDate) return alert('Please fill in required fields');
    try {
      setSubmitting(true);
      const billing = getRenewBillingBreakdown();
      const payload = {
        plan: renewData.plan,
        membershipStartDate: renewData.membershipStartDate.toISOString(),
        membershipEndDate: renewData.membershipEndDate?.toISOString(),
        status: 'active',
        planAmount: billing.planAmount,
        discountPercentage: billing.discountPct,
        discountAmount: billing.discountAmt,
        taxPercentage: billing.taxPct,
        taxAmount: billing.taxAmt,
        totalAmount: billing.total,
        paymentReceived: (member.paymentReceived || 0) + Number(renewData.paymentReceived || 0),
        paymentRemaining: renewData.paymentRemaining,
        nextPaymentDate: renewData.nextPaymentDate?.toISOString(),
        paymentMode: renewData.paymentMode || null,
        taxSlab: renewData.taxSlab || null
      };

      const response = await memberApi.update(id, payload);
      
      // Auto-download receipt if available
      if (response.receiptBuffer && response.receiptFilename) {
        const byteCharacters = atob(response.receiptBuffer);
        const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.receiptFilename;
        link.click();
        URL.revokeObjectURL(url);
      }

      alert('✅ Plan renewed successfully!');
      setShowRenewModal(false);
      fetchMemberData();
      fetchHistoryData();
    } catch (err) {
      alert('Failed to renew plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPaymentSubmit = async (e) => {
    e.preventDefault();
    if (additionalPayment <= 0) return alert('Enter a valid amount');
    try {
      setSubmitting(true);
      const payload = {
        additionalPayment: Number(additionalPayment),
        paymentMode: selectedPaymentMode,
        nextPaymentDate: paymentNextPayDate ? paymentNextPayDate.toISOString() : null
      };
      const response = await memberApi.update(id, payload);
      
      if (response.receiptBuffer && response.receiptFilename) {
        const byteCharacters = atob(response.receiptBuffer);
        const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.receiptFilename;
        link.click();
        URL.revokeObjectURL(url);
      }

      alert('✅ Payment added successfully!');
      setShowPaymentModal(false);
      setAdditionalPayment(0);
      fetchMemberData();
      fetchHistoryData();
    } catch (err) {
      alert('Failed to add payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
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

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A';
  const formatMonthYear = (date) => date ? new Date(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'N/A';

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
        <button 
          className="action-btn edit" 
          onClick={() => {
            setEditFormData(member);
            setShowEditModal(true);
          }}
          title="Edit Member"
        >
          <Edit size={20} />
          <span>Edit</span>
        </button>

        {member.paymentRemaining > 0 && (
          <button 
            className="action-btn payment" 
            onClick={() => {
              setAdditionalPayment(0);
              const hasUPI = paymentTypes.find(m => m.paymentType?.toUpperCase() === 'UPI');
              setSelectedPaymentMode(hasUPI ? hasUPI.paymentType : (paymentTypes[0]?.paymentType || 'UPI'));
              setPaymentNextPayDate(member.nextPaymentDate ? new Date(member.nextPaymentDate) : null);
              setShowPaymentModal(true);
            }}
            title="Add Payment"
          >
            <Wallet size={20} />
            <span>Add Payment</span>
          </button>
        )}

        {member.status === 'expired' && (
          <button 
            className="action-btn renew" 
            onClick={() => {
              const initialRenewData = {
                planCategory: member.plan?.category?._id || member.plan?.category || '',
                plan: member.plan?._id || '',
                taxSlab: member.taxSlab?._id || member.taxSlab || '',
                discountPercentage: 0,
                paymentReceived: 0,
                paymentRemaining: 0,
                membershipStartDate: new Date(),
                membershipEndDate: null,
                nextPaymentDate: null,
                paymentMode: ''
              };
              setDiscountType('percentage');
              setDiscountInputValue(0);
              setRenewData(recalcRenewData(initialRenewData));
              setShowRenewModal(true);
            }}
            title="Renew Membership"
          >
            <RefreshCw size={20} />
            <span>Renew</span>
          </button>
        )}
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
              
              {member.referredBy && (
                <div className="info-item" style={{ border: '1px dashed #3b82f6', borderRadius: '8px', padding: '10px', background: '#eff6ff' }}>
                  <div className="info-icon" style={{ color: '#3b82f6' }}><Share2 size={22} /></div>
                  <div className="info-text">
                    <label style={{ color: '#1d4ed8' }}>Referred By</label>
                    <p style={{ fontWeight: '600' }}>
                      {member.referredBy.name} ({member.referredBy.memberId})
                    </p>
                  </div>
                </div>
              )}
            </div>

            {member.referredMembers && member.referredMembers.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 className="section-title">REFERRAL PROGRAM (MEMBERS REFERRED)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {member.referredMembers.map(refMember => (
                    <div 
                      key={refMember._id} 
                      className="info-item" 
                      onClick={() => navigate(`/members/${refMember._id}`)}
                      style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        padding: '12px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div className="info-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><User size={22} /></div>
                      <div className="info-text">
                        <label>{refMember.memberId}</label>
                        <p style={{ fontWeight: '600' }}>{refMember.name}</p>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Status: <span style={{ color: refMember.status === 'active' ? '#16a34a' : '#ef4444', fontWeight: '500' }}>{refMember.status?.toUpperCase()}</span>
                        </span>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <ArrowRight size={18} color="#94a3b8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                                          <span className="p-date">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</span>
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
                                              <span className="p-date">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</span>
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
                                  {new Date(p.paymentDate).toLocaleDateString('en-GB', {
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
              </>
            )}
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="followups-container">
             <button className="add-followup-btn" onClick={() => {
              setEditingFollowUpId(null);
              setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
              setShowFollowUpModal(true);
            }}>
              <Plus size={20} /> Add New Follow-up
            </button>
            <div className="followup-list">
              {followups.length === 0 ? (
                <div className="empty-state">No follow-ups recorded</div>
              ) : (
                <>
                  <h3 className="followup-section-title">Follow-up History</h3>
                  {followups.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(f => (
                    <div key={f._id} className={`followup-card ${f.status}`}>
                      <div className="followup-note">{f.note}</div>
                      <div className="followup-meta">
                        <span className="followup-date">
                          📅 {new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {f.followUpDate && f.status === 'pending' && (
                          <span className="next-date-badge">
                            Next: {new Date(f.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        <span className={`fu-status-label ${f.status}`}>{f.status}</span>
                      </div>
                      <div className="followup-footer">
                        {f.status === 'pending' && (
                          <>
                            <button className="btn-complete" onClick={() => handleMarkFollowUpComplete(f._id)}>
                              <CheckCircle size={16} /> Mark Complete
                            </button>
                            <button className="btn-edit-small" onClick={() => handleEditFollowUp(f)}>
                              <Edit2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inline Forms & Modals */}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Edit Member Details</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-content scrollable-form">
                <div className="form-group-custom">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editFormData.name || ''} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    value={editFormData.mobileNumber || ''} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditFormData({...editFormData, mobileNumber: val});
                    }}
                    required
                    maxLength="10"
                    minLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div className="form-group-custom">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email || ''} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>Gender</label>
                  <select 
                    value={editFormData.gender || ''}
                    onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group-custom">
                  <label>Membership Start Date</label>
                  <DatePicker
                    selected={editFormData.membershipStartDate ? new Date(editFormData.membershipStartDate) : null}
                    onChange={(date) => setEditFormData({ ...editFormData, membershipStartDate: date })}
                    dateFormat="dd/MM/yyyy"
                    className="date-input"
                    placeholderText="Select start date"
                  />
                </div>
                <div className="form-group-custom">
                  <label>Membership End Date</label>
                  <DatePicker
                    selected={editFormData.membershipEndDate ? new Date(editFormData.membershipEndDate) : null}
                    onChange={(date) => setEditFormData({ ...editFormData, membershipEndDate: date })}
                    dateFormat="dd/MM/yyyy"
                    className="date-input"
                    placeholderText="Select end date"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add Payment</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPaymentSubmit}>
              <div className="form-content">
                <div className="payment-summary-compact">
                   <p>Pending: <strong>₹{member.paymentRemaining}</strong></p>
                </div>
                <div className="form-group-custom">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    value={additionalPayment} 
                    onChange={(e) => setAdditionalPayment(e.target.value)}
                    max={member.paymentRemaining}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>Payment Mode <span className="required">*</span></label>
                  <select 
                    value={selectedPaymentMode} 
                    onChange={(e) => setSelectedPaymentMode(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Mode</option>
                    {paymentTypes.length > 0 ? (
                      paymentTypes.map(m => (
                        <option key={m._id} value={m.paymentType}>{m.paymentType}</option>
                      ))
                    ) : (
                      <>
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group-custom">
                  <label>Next Payment Date <span className="required">*</span></label>
                  <div className="date-input-wrapper">
                    <DatePicker
                      selected={paymentNextPayDate}
                      onChange={(date) => setPaymentNextPayDate(date)}
                      className="form-control"
                      placeholderText="Select date"
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      required
                      portalId="root"
                    />
                    <span className="date-input-icon">📅</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Plan Modal */}
      {showRenewModal && (
        <div className="modal-overlay" onClick={() => setShowRenewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
               <h2>Renew Membership</h2>
               <button className="btn-close" onClick={() => setShowRenewModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRenewSubmit}>
              <div className="form-content scrollable-form">
                <div className="form-divider">Plan Details</div>
                <div className="form-grid-2">
                  <div className="form-group-custom">
                    <label>Category</label>
                    <select 
                      value={renewData.planCategory} 
                      onChange={(e) => setRenewData({...renewData, planCategory: e.target.value, plan: ''})}
                    >
                      <option value="">Select Category</option>
                      {planCategories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                    </select>
                  </div>
                  <div className="form-group-custom">
                    <label>Plan</label>
                    <select 
                      value={renewData.plan} 
                      onChange={(e) => {
                        const updated = {...renewData, plan: e.target.value};
                        setRenewData(recalcRenewData(updated));
                      }}
                      required
                    >
                      <option value="">Select Plan</option>
                      {plans.filter(p => p.category?._id === renewData.planCategory || p.category === renewData.planCategory).map(p => (
                        <option key={p._id} value={p._id}>{p.planName} - ₹{p.price}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-divider">Dates</div>
                <div className="form-grid-2">
                  <div className="form-group-custom">
                    <label>Start Date</label>
                    <DatePicker
                      selected={renewData.membershipStartDate}
                      onChange={(date) => setRenewData(recalcRenewData({...renewData, membershipStartDate: date}))}
                      dateFormat="dd/MM/yyyy"
                      className="date-input"
                      minDate={isAdmin ? undefined : new Date()}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>End Date (Auto)</label>
                    <input 
                      type="text" 
                      value={renewData.membershipEndDate ? new Date(renewData.membershipEndDate).toLocaleDateString('en-GB') : '-'} 
                      readOnly 
                      className="read-only-input"
                    />
                  </div>
                </div>

                <div className="form-divider">Payment Details</div>
                <div className="form-grid-2">
                  <div className="form-group-custom">
                    <label>Tax Slab</label>
                    <select 
                      value={renewData.taxSlab} 
                      onChange={(e) => setRenewData(recalcRenewData({...renewData, taxSlab: e.target.value}))}
                    >
                      <option value="">No Tax</option>
                      {taxSlabs.map(s => <option key={s._id} value={s._id}>{s.name} ({s.taxPercentage}%)</option>)}
                    </select>
                  </div>
                  <div className="form-group-custom">
                    <label>Payment Mode <span className="required">*</span></label>
                    <select 
                      value={renewData.paymentMode} 
                      onChange={(e) => setRenewData({...renewData, paymentMode: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select Mode</option>
                      {paymentTypes.length > 0 ? (
                        paymentTypes.map(m => (
                          <option key={m._id} value={m.paymentType}>{m.paymentType}</option>
                        ))
                      ) : (
                        <>
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-custom">
                    <label>Payment Received <span className="required">*</span></label>
                    <input 
                      type="number" 
                      value={renewData.paymentReceived} 
                      onChange={(e) => setRenewData(recalcRenewData({...renewData, paymentReceived: e.target.value}))}
                      required
                      min="0"
                    />
                  </div>
                  {renewData.paymentRemaining > 0 && (
                    <div className="form-group-custom">
                      <label>Next Payment Date <span className="required">*</span></label>
                      <div className="date-input-wrapper">
                        <DatePicker
                          selected={renewData.nextPaymentDate}
                          onChange={(date) => setRenewData({...renewData, nextPaymentDate: date})}
                          dateFormat="dd/MM/yyyy"
                          className="date-input"
                          minDate={new Date()}
                          required
                          portalId="root"
                        />
                        <span className="date-input-icon">📅</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="renewal-summary-box">
                    <div className="summary-row">
                      <span>Plan Total:</span>
                      <span>₹{getRenewBillingBreakdown().total}</span>
                    </div>
                    <div className="summary-row remaining">
                      <span>Remaining:</span>
                      <span>₹{renewData.paymentRemaining}</span>
                    </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Renewing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay" onClick={() => { setShowFollowUpModal(false); setEditingFollowUpId(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>{editingFollowUpId ? 'Edit Follow-up' : 'Add Follow-up'}</h2>
              <button className="btn-close" onClick={() => { setShowFollowUpModal(false); setEditingFollowUpId(null); }}>✕</button>
            </div>
            <div className="form-content">
              <div className="form-group-custom">
                <label>Note <span className="required">*</span></label>
                <textarea 
                  value={followUpData.note}
                  onChange={(e) => setFollowUpData({ ...followUpData, note: e.target.value })}
                  placeholder="Enter follow-up details..."
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-custom">
                  <label>Follow-up Date</label>
                  <DatePicker
                    selected={followUpData.followUpDate}
                    onChange={(date) => setFollowUpData({ ...followUpData, followUpDate: date })}
                    dateFormat="dd/MM/yyyy"
                    className="date-input"
                    minDate={new Date()}
                    placeholderText="Select date"
                    portalId="root"
                  />
                </div>
                <div className="form-group-custom">
                  <label>Follow-up Time</label>
                  <input 
                    type="time" 
                    value={followUpData.followUpTime || ''} 
                    onChange={(e) => setFollowUpData({ ...followUpData, followUpTime: e.target.value })}
                    className="date-input"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  className="submit-btn" 
                  onClick={handleAddFollowUp}
                  disabled={submittingFollowUp}
                  style={{
                    width: 'auto',
                    padding: '0.6rem 1.5rem',
                    opacity: submittingFollowUp ? 0.7 : 1,
                    cursor: submittingFollowUp ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem'
                  }}
                >
                  {submittingFollowUp ? '⏳ Saving...' : (editingFollowUpId ? '✅ Update' : '💾 Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
