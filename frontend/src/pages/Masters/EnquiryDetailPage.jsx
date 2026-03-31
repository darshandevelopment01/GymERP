import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enquiryApi from '../../services/enquiryApi';
import followupApi from '../../services/followupApi';
import memberApi from '../../services/memberApi';
import branchApi from '../../services/branchApi';
import planApi from '../../services/planApi';
import { taxSlabAPI, planCategoryAPI } from '../../services/mastersApi';
import { usePermissions } from '../../hooks/usePermissions';
import './EnquiryDetailPage.css';

const EnquiryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState('details');
  const [enquiry, setEnquiry] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Metadata for modals
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [planCategories, setPlanCategories] = useState([]);

  // Modals visibility
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditEnquiryModal, setShowEditEnquiryModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  
  // Follow-up state
  const [followUpData, setFollowUpData] = useState({ note: '', followUpDate: null, followUpTime: '', status: 'pending' });
  const [editingFollowUp, setEditingFollowUp] = useState(null);

  // Enquiry Edit state
  const [editFormData, setEditFormData] = useState({});

  // Conversion state
  const [paymentData, setPaymentData] = useState({
    planCategory: '',
    plan: '',
    dateOfBirth: null,
    taxSlab: '',
    discountPercentage: 0,
    paymentReceived: 0,
    paymentRemaining: 0,
    membershipStartDate: new Date(),
    membershipEndDate: null
  });
  const [submittingConvert, setSubmittingConvert] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [b, p, t, c] = await Promise.all([
        branchApi.getAll(),
        planApi.getAll(),
        taxSlabAPI.getAll(),
        planCategoryAPI.getAll()
      ]);
      setBranches(b);
      setPlans(p);
      setTaxSlabs(t);
      setPlanCategories(c);
    } catch (err) {
      console.error('Error fetching metadata:', err);
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
      membershipEndDate: calculatedEndDate
    };
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

  const handleConvertClick = () => {
    const initialData = {
      planCategory: '',
      plan: enquiry.plan?._id || '',
      dateOfBirth: enquiry.dateOfBirth ? new Date(enquiry.dateOfBirth) : null,
      taxSlab: '',
      discountPercentage: 0,
      paymentReceived: 0,
      paymentRemaining: 0,
      membershipStartDate: new Date(),
      membershipEndDate: null
    };
    setPaymentData(recalcRemaining(initialData));
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.plan || !paymentData.dateOfBirth || (paymentData.paymentReceived === '' || paymentData.paymentReceived <= 0)) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmittingConvert(true);
      const billing = getBillingBreakdown();
      const memberData = {
        name: enquiry.name,
        email: enquiry.email,
        mobileNumber: enquiry.mobileNumber,
        dateOfBirth: paymentData.dateOfBirth.toISOString(),
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
        status: 'active',
        membershipStartDate: paymentData.membershipStartDate.toISOString(),
        membershipEndDate: paymentData.membershipEndDate ? paymentData.membershipEndDate.toISOString() : null,
        enquiryId: id,
        ...(enquiry.profilePhoto && { profilePhoto: enquiry.profilePhoto })
      };

      const response = await memberApi.create(memberData);
      
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
    e.preventDefault();
    if (!followUpData.note.trim()) return alert('Note is required');
    try {
      const data = {
        ...followUpData,
        enquiry: id,
        followUpDate: followUpData.followUpDate ? followUpData.followUpDate.toISOString().split('T')[0] : null
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
    } catch (err) {
      console.error(err);
      alert('Failed to save follow-up');
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

  if (loading) return <div className="loading-state">Loading enquiry details...</div>;
  if (error) return <div className="error-state">{error} <button onClick={fetchData}>Retry</button></div>;
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
                    {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
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
                  <><AlertCircle size={20} /> This enquiry is marked as lost and cannot be edited.</>
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
                          📅 {new Date(fu.createdAt).toLocaleDateString()}
                        </span>
                        {fu.followUpDate && fu.status === 'pending' && (
                          <span className="next-date-badge">
                            Next: {new Date(fu.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`fu-status-label ${fu.status}`}>{fu.status}</span>
                      </div>
                      <div className="followup-footer">
                        {fu.status === 'pending' && (
                          <button className="btn-complete" onClick={() => handleMarkFollowUpComplete(fu._id)}>
                            <CheckCircle size={16} /> Mark Complete
                          </button>
                        )}
                        <button className="btn-edit-small" onClick={() => handleEditFollowUpClick(fu)}>
                          <Edit2 size={16} />
                        </button>
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

      {/* 1. Payment/Conversion Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>💳 Convert to Member</h2>
              <button className="btn-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-content" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Plan Category <span className="required">*</span></label>
                  <select 
                    value={paymentData.planCategory} 
                    onChange={(e) => setPaymentData(prev => recalcRemaining({...prev, planCategory: e.target.value}))}
                  >
                    <option value="">Select Category</option>
                    {planCategories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Plan <span className="required">*</span></label>
                  <select 
                    value={paymentData.plan} 
                    required
                    onChange={(e) => setPaymentData(prev => recalcRemaining({...prev, plan: e.target.value}))}
                  >
                    <option value="">Select Plan</option>
                    {plans
                      .filter(p => !paymentData.planCategory || p.category?._id === paymentData.planCategory || p.category === paymentData.planCategory)
                      .map(p => <option key={p._id} value={p._id}>{p.planName} - ₹{p.price}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth <span className="required">*</span></label>
                  <DatePicker
                    selected={paymentData.dateOfBirth}
                    onChange={(date) => setPaymentData(prev => ({...prev, dateOfBirth: date}))}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select Date of Birth"
                    maxDate={new Date()}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Received (₹) <span className="required">*</span></label>
                  <input 
                    type="number" 
                    value={paymentData.paymentReceived} 
                    onChange={(e) => setPaymentData(prev => recalcRemaining({...prev, paymentReceived: e.target.value}))}
                    placeholder="Enter amount"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Remaining Amount (₹)</label>
                  <input type="text" value={paymentData.paymentRemaining} disabled />
                </div>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">
                  {editingFollowUp ? 'Update Follow-up' : 'Add Follow-up'}
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
