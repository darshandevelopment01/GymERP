import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SkeletonLoader from '../../components/SkeletonLoader';
import { 
  ChevronLeft, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  Tag, 
  FileText, 
  Plus, 
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enquiryApi from '../../services/enquiryApi';
import followupApi from '../../services/followupApi';
import memberApi from '../../services/memberApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import { taxSlabAPI, planCategoryAPI, paymentTypeAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import { compressImage } from '../../utils/compressImage';
import { formatLocalDate } from '../../utils/dateUtils';
import './EnquiryDetailPage.css';

const EnquiryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState('details');
  // Instant render: try to get enquiry data from router state (passed from GenericMaster)
  const [enquiry, setEnquiry] = useState(location.state?.item || null);
  const [followups, setFollowups] = useState([]);
  // If we already have enquiry data from state, we don't need a full-page loading block
  const [loading, setLoading] = useState(!enquiry);
  const [error, setError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Metadata for modals
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [planCategories, setPlanCategories] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);

  // Discount permissions
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState(0);
  const [noDiscountLimit, setNoDiscountLimit] = useState(false);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'value'
  const [discountWarning, setDiscountWarning] = useState('');
  const [discountInputValue, setDiscountInputValue] = useState(0);

  // Modals visibility
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditEnquiryModal, setShowEditEnquiryModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  
  // Follow-up state
  const [followUpData, setFollowUpData] = useState({ note: '', followUpDate: null, followUpTime: '', status: 'pending' });
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  // Enquiry Edit state
  const [editFormData, setEditFormData] = useState({});

  // Conversion state
  const [paymentData, setPaymentData] = useState({
    planCategory: '',
    plan: '',
    taxSlab: '',
    discountPercentage: 0,
    paymentRemaining: 0,
    paymentMode: '',
    membershipStartDate: new Date(),
    membershipEndDate: null,
    nextPaymentDate: null,
    profilePhoto: ''
  });
  const [submittingConvert, setSubmittingConvert] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [b, p, t, c, pt] = await Promise.all([
        branchApi.getAll(),
        planApi.getAll(),
        taxSlabAPI.getAll(),
        planCategoryAPI.getAll(),
        paymentTypeAPI.getAll(),
        fetchCurrentUserDiscount()
      ]);
      setBranches(Array.isArray(b) ? b : (b.data || []));
      setPlans(p.data || []);
      setTaxSlabs((t.data || []).filter(s => s.status === 'active'));
      setPlanCategories((c.data || []).filter(cat => cat.status === 'active'));
      setPaymentTypes((pt.data || []).filter(type => type.status === 'active'));
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
        setDiscountOptions(result.data.discountOptions || []);
      }
    } catch (error) {
      console.error('Error fetching user discount:', error);
      setMaxDiscountPercentage(0);
      setNoDiscountLimit(false);
      setDiscountOptions([]);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [enquiryData, followupData] = await Promise.all([
        enquiryApi.getById(id),
        followupApi.getByEnquiry(id)
      ]);
      setEnquiry(enquiryData.data);
      setFollowups(followupData.data);
      setEditFormData(enquiryData.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load enquiry details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, [fetchData]);

  // --- Payment Helper Logic (copied from EnquiryMaster) ---
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

    let updatedData = { ...paymentData, plan: planId };
    
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

  // --- Handlers ---
  const handleLost = async () => {
    if (window.confirm(`Are you sure you want to mark "${enquiry.name}" as LOST?`)) {
      try {
        await enquiryApi.update(id, { status: 'lost' });
        alert('📉 Enquiry marked as LOST');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to mark as lost');
      }
    }
  };

  const handleReopen = async () => {
    if (window.confirm(`Are you sure you want to REOPEN "${enquiry.name}"? It will be moved back to PENDING status.`)) {
      try {
        setLoading(true);
        await enquiryApi.reopen(id);
        alert('✅ Enquiry reopened successfully!');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to reopen enquiry: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConvertClick = () => {
    const initialData = {
      planCategory: enquiry.plan?.category?._id || enquiry.plan?.category || '',
      plan: enquiry.plan?._id || '',
      taxSlab: '',
      discountPercentage: 0,
      paymentReceived: 0,
      paymentRemaining: 0,
      paymentMode: '',
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.plan || (paymentData.paymentReceived === '' || paymentData.paymentReceived < 0) || !paymentData.paymentMode) {
      alert('Please fill all required fields, including payment mode');
      return;
    }

    try {
      setSubmittingConvert(true);
      const billing = getBillingBreakdown();
      const memberData = {
        name: enquiry.name,
        email: enquiry.email,
        mobileNumber: enquiry.mobileNumber,
        gender: enquiry.gender,
        branch: enquiry.branch._id || enquiry.branch,
        plan: paymentData.plan,
        ...(paymentData.taxSlab && { taxSlab: paymentData.taxSlab }),
        planAmount: billing.planAmount,
        discountPercentage: billing.discountPct,
        discountAmount: billing.discountAmt,
        taxPercentage: billing.taxPct,
        taxAmount: billing.taxAmt,
        totalAmount: billing.total,
        paymentReceived: Number(paymentData.paymentReceived),
        paymentRemaining: paymentData.paymentRemaining,
        paymentMode: paymentData.paymentMode,
        status: 'active',
        membershipStartDate: paymentData.membershipStartDate.toISOString(),
        membershipEndDate: paymentData.membershipEndDate ? paymentData.membershipEndDate.toISOString() : null,
        nextPaymentDate: paymentData.nextPaymentDate ? paymentData.nextPaymentDate.toISOString() : null,
        enquiryId: id,
        profilePhoto: paymentData.profilePhoto || enquiry.profilePhoto || null
      };

      const response = await memberApi.create(memberData);
      console.log('Member created:', response);
      console.log('📄 Receipt keys:', { hasBuffer: !!response.receiptBuffer, hasFilename: !!response.receiptFilename });
      
      // Auto-download receipt logic
      if (response.receiptBuffer && response.receiptFilename) {
        const byteCharacters = atob(response.receiptBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
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
      }

      await enquiryApi.update(id, { status: 'converted' });
      alert('✅ Enquiry converted to Member successfully!');
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('❌ Failed to convert to member');
    } finally {
      setSubmittingConvert(false);
    }
  };

  const handleEditEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await enquiryApi.update(id, editFormData);
      alert('✅ Enquiry updated successfully');
      setShowEditEnquiryModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update enquiry');
    }
  };

  const handleAddFollowUpClick = () => {
    setEditingFollowUp(null);
    setFollowUpData({ note: '', followUpDate: null, followUpTime: '', status: 'pending' });
    setShowFollowUpModal(true);
  };

  const handleEditFollowUpClick = (fu) => {
    setEditingFollowUp(fu);
    setFollowUpData({
      note: fu.note,
      followUpDate: fu.followUpDate ? new Date(fu.followUpDate) : null,
      followUpTime: fu.followUpTime || '',
      status: fu.status
    });
    setShowFollowUpModal(true);
  };

  const handleFollowUpSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingFollowUp) return;
    if (!followUpData.note.trim()) return alert('Note is required');
    try {
      setSubmittingFollowUp(true);
      const data = {
        ...followUpData,
        enquiry: id,
        followUpDate: formatLocalDate(followUpData.followUpDate)
      };

      if (editingFollowUp) {
        await followupApi.update(editingFollowUp._id, data);
        alert('✅ Follow-up updated');
      } else {
        await followupApi.create(data);
        alert('✅ Follow-up added');
      }
      setShowFollowUpModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving follow-up:', error);
      alert('Failed to save follow-up');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleMarkFollowUpComplete = async (fuId) => {
    try {
      await followupApi.updateStatus(fuId, 'completed');
      alert('✅ Follow-up marked as completed');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (loading && !enquiry) return <SkeletonLoader variant="enquiry-detail" />;
  if (error) return (
    <div className="error-card-container">
      <div className="error-card">
        <div className="error-icon-wrapper">
          <AlertCircle size={32} />
        </div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button className="btn-retry" onClick={fetchData}>
            <RefreshCw size={18} /> Retry
          </button>
          <button className="btn-go-back" onClick={() => navigate('/enquiry')}>
            Back to List
          </button>
        </div>
      </div>
    </div>
  );
  if (!enquiry) return <div className="error-state">Enquiry not found</div>;

  const isPending = enquiry.status === 'pending';

  return (
    <div className="enquiry-detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/enquiry')}>
            <ChevronLeft size={20} /> Back to List
          </button>
          <div className="detail-tabs">
            <button 
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`tab-btn ${activeTab === 'followups' ? 'active' : ''}`}
              onClick={() => setActiveTab('followups')}
            >
              Follow-ups ({followups.length})
            </button>
          </div>
        </div>
        
        <div className="enquiry-title-section">
          <h1>{enquiry.name}</h1>
          <span className={`status-badge ${enquiry.status}`}>
            {enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
          </span>
        </div>
      </header>

      {/* Tab Content */}
      <main className="tab-content">
        {activeTab === 'details' ? (
          <div className="details-grid">
            {/* Actions for Pending */}
            {isPending && (
              <div className="detail-actions">
                <button className="btn-action btn-convert" onClick={handleConvertClick}>
                  <ArrowRight size={20} /> Convert to Member
                </button>
                <button className="btn-action btn-lost" onClick={handleLost}>
                  <Trash2 size={20} /> Mark as Lost
                </button>
                <button className="btn-action btn-edit" onClick={() => setShowEditEnquiryModal(true)}>
                  <Edit2 size={18} /> Edit Enquiry
                </button>
              </div>
            )}

            {/* Actions for Lost */}
            {enquiry.status === 'lost' && (
              <div className="detail-actions">
                <button className="btn-action btn-reopen" onClick={handleReopen}>
                  <Clock size={20} /> Reopen Enquiry
                </button>
                <button className="btn-action btn-edit" onClick={() => setShowEditEnquiryModal(true)}>
                  <Edit2 size={18} /> Edit Enquiry
                </button>
              </div>
            )}

            <div className="detail-card">
              <div className="info-row">
                <div className="info-icon"><Phone size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Mobile Number</span>
                  <span className="value-text">{enquiry.mobileNumber}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><Mail size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Email Address</span>
                  <span className="value-text">{enquiry.email || 'N/A'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><MapPin size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Branch</span>
                  <span className="value-text">{enquiry.branch?.name || 'N/A'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><User size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Gender</span>
                  <span className="value-text">{enquiry.gender || 'N/A'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><Calendar size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Enquiry Date</span>
                  <span className="value-text">
                    {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><User size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Enquired By</span>
                  <span className="value-text">{enquiry.createdBy?.name || 'Unknown'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><Tag size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Source</span>
                  <span className="value-text">{enquiry.source || 'N/A'}</span>
                </div>
              </div>
              <div className="info-row" style={{ gridColumn: '1 / -1' }}>
                <div className="info-icon"><FileText size={18} /></div>
                <div className="info-label">
                  <span className="label-text">Notes</span>
                  <span className="value-text">{enquiry.notes || 'No notes added'}</span>
                </div>
              </div>
            </div>

            {/* Status Based Banner */}
            {!isPending && (
              <div className={`read-only-banner ${enquiry.status === 'converted' ? 'converted' : ''}`}>
                {enquiry.status === 'converted' ? (
                  <><CheckCircle size={20} /> This enquiry has been converted to a member.</>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertCircle size={20} /> This enquiry is marked as lost.
                    </div>
                    <button className="reopen-inline-btn" onClick={handleReopen} style={{
                      background: 'white',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Clock size={14} /> Reopen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="followups-container">
            {isPending && (
              <button className="add-followup-btn" onClick={handleAddFollowUpClick}>
                <Plus size={20} /> Add New Follow-up
              </button>
            )}

            <div className="followup-list">
              {followups.length === 0 ? (
                <div className="empty-state">No follow-ups found for this enquiry.</div>
              ) : (
                <>
                  <h3 className="followup-section-title">Follow-up History</h3>
                  {followups.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(fu => (
                    <div key={fu._id} className={`followup-card ${fu.status}`}>
                      <div className="followup-note">{fu.note}</div>
                      <div className="followup-meta">
                        <span className="followup-date">
                          📅 {new Date(fu.createdAt).toLocaleDateString('en-GB')}
                        </span>
                        {fu.followUpDate && fu.status === 'pending' && (
                          <span className="next-date-badge">
                            Next: {new Date(fu.followUpDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        <span className={`fu-status-label ${fu.status}`}>{fu.status}</span>
                      </div>
                      <div className="followup-footer">
                        {fu.status === 'pending' && (
                          <>
                            <button className="btn-complete" onClick={() => handleMarkFollowUpComplete(fu._id)}>
                              <CheckCircle size={16} /> Mark Complete
                            </button>
                            <button className="btn-edit-small" onClick={() => handleEditFollowUpClick(fu)}>
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
      </main>

      {/* --- MODALS --- */}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Convert to Member - Payment Details</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-content" style={{ gridTemplateColumns: '1fr' }}>
                <div className="enquiry-info" style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
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
                    <label style={{
                      display: 'block',
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      color: '#6366f1',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
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
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Name:</strong> {enquiry?.name}</p>
                    <p style={{ margin: '0.25rem 0', color: '#64748b' }}><strong>Mobile:</strong> {enquiry?.mobileNumber}</p>
                  </div>
                </div>

                <div className="responsive-form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Plan Category <span className="required">*</span></label>
                    <select 
                      value={paymentData.planCategory} 
                      onChange={(e) => {
                        const catId = e.target.value;
                        setPaymentData(prev => recalcRemaining({...prev, planCategory: catId, plan: ''}));
                      }}
                      required
                    >
                      <option value="">Select Category</option>
                      {planCategories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Membership Plan <span className="required">*</span></label>
                    <select 
                      value={paymentData.plan} 
                      required
                      onChange={handlePlanChangeInPayment}
                      disabled={!paymentData.planCategory}
                    >
                      <option value="">{paymentData.planCategory ? 'Select Membership Plan' : 'Select a category first'}</option>
                      {plans
                        .filter(p => {
                          if (!paymentData.planCategory) return false;
                          const catId = typeof p.category === 'object' ? p.category?._id : p.category;
                          return catId === paymentData.planCategory;
                        })
                        .map(p => <option key={p._id} value={p._id}>{p.planName} - ₹{p.price} ({p.duration})</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Membership Start Date <span className="required">*</span></label>
                    <DatePicker
                      selected={paymentData.membershipStartDate}
                      onChange={(date) => setPaymentData(prev => recalcRemaining({...prev, membershipStartDate: date}))}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select Start Date"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Membership End Date</label>
                    <DatePicker
                      selected={paymentData.membershipEndDate}
                      onChange={() => {}}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Calculated automatically"
                      disabled
                    />
                  </div>
                </div>

                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label>Tax Slab (GST)</label>
                    <select value={paymentData.taxSlab} onChange={handleTaxSlabChange}>
                      <option value="">No Tax</option>
                      {taxSlabs.map(slab => (
                        <option key={slab._id} value={slab._id}>GST {slab.taxPercentage}%</option>
                      ))}
                    </select>
                  </div>
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
                            right: '35px',
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
                </div>

                <div className="responsive-form-grid">
                  <div className="form-group">
                    <label>Payment Received (₹) <span className="required">*</span></label>
                    <input 
                      type="number" 
                      value={paymentData.paymentReceived} 
                      onChange={handlePaymentChange}
                      placeholder="Enter amount"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Mode <span className="required">*</span></label>
                    <select 
                      value={paymentData.paymentMode} 
                      onChange={(e) => setPaymentData(prev => ({...prev, paymentMode: e.target.value}))}
                      required
                    >
                      <option value="">Select Mode</option>
                      {paymentTypes.map(pt => (
                        <option key={pt._id} value={pt.paymentType}>
                          {pt.paymentType}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="responsive-form-grid" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label>Remaining Amount (₹)</label>
                    <input 
                      type="number" 
                      value={paymentData.paymentRemaining} 
                      readOnly 
                      disabled 
                      style={{ background: '#f1f5f9' }}
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

                {/* Billing Summary Section */}
                {paymentData.plan && (() => {
                  const b = getBillingBreakdown();
                  return (
                    <div className="billing-summary" style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginTop: '0.5rem'
                    }}>
                      <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '0.9rem' }}>💰 Billing Summary</h4>
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Plan Amount</span>
                        <span>₹{b.planAmount}</span>
                      </div>
                      {b.discountPct > 0 && (
                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#16a34a' }}>
                          <span>Discount ({b.discountPct}%)</span>
                          <span>- ₹{b.discountAmt}</span>
                        </div>
                      )}
                      {b.taxPct > 0 && (
                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#ea580c' }}>
                          <span>GST ({b.taxPct}%)</span>
                          <span>+ ₹{b.taxAmt}</span>
                        </div>
                      )}
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem', color: '#10b981' }}>
                        <span>Total Amount</span>
                        <span>₹{b.total}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submittingConvert}>
                  {submittingConvert ? 'Processing...' : 'Complete Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Enquiry Modal */}
      {showEditEnquiryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Enquiry</h2>
              <button className="btn-close" onClick={() => setShowEditEnquiryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditEnquirySubmit}>
              <div className="form-content">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editFormData.name || ''} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    value={editFormData.mobileNumber || ''} 
                    onChange={(e) => setEditFormData({...editFormData, mobileNumber: e.target.value})} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email || ''} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    value={editFormData.gender || ''} 
                    onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <textarea 
                    value={editFormData.notes || ''} 
                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowEditEnquiryModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Follow-up Modal */}
      {showFollowUpModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingFollowUp ? '✏️ Edit Follow-up' : '📝 Add Follow-up'}</h2>
              <button className="btn-close" onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFollowUpSubmit}>
              <div className="form-content" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Note <span className="required">*</span></label>
                  <textarea 
                    value={followUpData.note} 
                    onChange={(e) => setFollowUpData({...followUpData, note: e.target.value})} 
                    placeholder="Enter follow-up details..." 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Next Follow-up Date</label>
                  <DatePicker
                    selected={followUpData.followUpDate}
                    onChange={(date) => setFollowUpData({...followUpData, followUpDate: date})}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Optional"
                    minDate={new Date()}
                  />
                </div>
                <div className="form-group">
                  <label>Follow-up Time</label>
                  <input 
                    type="time" 
                    value={followUpData.followUpTime || ''} 
                    onChange={(e) => setFollowUpData({...followUpData, followUpTime: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submittingFollowUp}>
                  {submittingFollowUp ? '⏳ Saving...' : (editingFollowUp ? 'Update Follow-up' : 'Add Follow-up')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryDetailPage;
