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
  RefreshCw
} from 'lucide-react';
import memberApi from '../../services/memberApi';
import followupApi from '../../services/followupApi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MemberDetailPage.css';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Instant render: try to get member data from router state (passed from GenericMaster)
  const [member, setMember] = useState(location.state?.item || null);
  const [followups, setFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('contact'); // 'contact', 'plan', 'history', 'followups'
  // If we already have member data from state, we don't need a full-page loading block
  const [loading, setLoading] = useState(!member);
  const [error, setError] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('plans');
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => {
    fetchMemberData();
  }, [id]);

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
        followUpDate: followUpData.followUpDate,
        followUpTime: followUpData.followUpTime,
        status: 'pending'
      };
      await followupApi.create(payload);
      setShowFollowUpModal(false);
      setFollowUpData({ note: '', followUpDate: null, followUpTime: '' });
      fetchFollowups();
    } catch (err) {
      alert('Failed to add follow-up: ' + err.message);
    }
  };

  if (loading && !member) return (
    <SkeletonLoader variant="member-detail" />
  );
  if (error) return <div className="member-detail-error"><h3>⚠️ Error</h3><p>{error}</p><button onClick={() => navigate('/members')}>Go Back</button></div>;
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
        <button 
          className="action-btn edit" 
          onClick={() => navigate(`/members?action=edit&memberId=${id}`)}
          title="Edit Member"
        >
          <Edit size={20} />
          <span>Edit</span>
        </button>

        {member.paymentRemaining > 0 && (
          <button 
            className="action-btn payment" 
            onClick={() => navigate(`/members?action=addPayment&memberId=${id}`)}
            title="Add Payment"
          >
            <Wallet size={20} />
            <span>Add Payment</span>
          </button>
        )}

        {member.status === 'expired' && (
          <button 
            className="action-btn renew" 
            onClick={() => navigate(`/members?action=renew&memberId=${id}`)}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add Follow-up</h2>
              <button className="btn-close" onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>
            <div className="form-content">
              <div className="form-group-custom">
                <label>Note</label>
                <textarea 
                  value={followUpData.note}
                  onChange={(e) => setFollowUpData({ ...followUpData, note: e.target.value })}
                  placeholder="Enter details..."
                />
              </div>
              <div className="form-group-custom">
                <label>Next Follow-up Date</label>
                <DatePicker
                  selected={followUpData.followUpDate}
                  onChange={(date) => setFollowUpData({ ...followUpData, followUpDate: date })}
                  dateFormat="dd/MM/yyyy"
                  className="date-input"
                  minDate={new Date()}
                />
              </div>
              <button className="submit-btn" onClick={handleAddFollowUp}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;
