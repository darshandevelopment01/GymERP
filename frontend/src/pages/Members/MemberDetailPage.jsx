import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [member, setMember] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('contact'); // 'contact', 'plan', 'history', 'followups'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    note: '',
    followUpDate: null,
    followUpTime: ''
  });

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'followups') {
      fetchFollowups();
    }
  }, [activeTab]);

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
      const data = await followupApi.getByMember(id);
      setFollowups(data || []);
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
        memberId: id,
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

  if (loading) return (
    <div className="member-detail-loading">
      <Loader2 size={40} className="spinner" />
      <p>Fetching member profile...</p>
    </div>
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
          <ArrowLeft size={24} />
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

        <button 
          className="action-btn history" 
          onClick={() => navigate(`/members?action=history&memberId=${id}`)}
          title="View Activity History"
        >
          <History size={20} />
          <span>History</span>
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
                <div className="info-icon"><MapPin size={22} /></div>
                <div className="info-text">
                  <label>Address</label>
                  <p>{member.address || 'NA'}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><Calendar size={22} /></div>
                <div className="info-text">
                  <label>Date of Birth</label>
                  <p>{formatDate(member.dateOfBirth)}</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><Heart size={22} /></div>
                <div className="info-text">
                  <label>Emergency Contact</label>
                  <p>{member.mobileNumber} (Primary)</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon"><User size={22} /></div>
                <div className="info-text">
                  <label>Gender</label>
                  <p>{member.gender}</p>
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
                  member.payments.map((payment, index) => (
                    <div className="receipt-item" key={index}>
                      <div className="receipt-details">
                        <h4>{member.plan?.planName || 'Plan Receipt'}</h4>
                        <p>Date: {formatDate(payment.paymentDate)}</p>
                        <p>Amount: ₹{payment.amount}</p>
                      </div>
                      <button className="share-btn" onClick={() => downloadReceipt(payment, index)}>
                        <Share2 size={18} /> Share
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-data-card">No payment history found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h3 className="section-title">MEMBERSHIP HISTORY</h3>
            <div className="history-list">
              {member.history?.length > 0 ? (
                member.history.map((h, index) => (
                  <div className="history-item" key={index}>
                    <div className="history-header">
                      <h4>{h.plan?.planName || 'Previous Plan'}</h4>
                      <span className={`status-tag status-${h.status}`}>{h.status}</span>
                    </div>
                    <p className="duration">Duration: {formatDate(h.membershipStartDate)} - {formatDate(h.membershipEndDate)}</p>
                    <div className="price-row">
                      <p className="paid-amount">Paid: ₹{h.paymentReceived}</p>
                      {h.discountAmount > 0 && (
                        <span className="discount-tag">₹{h.discountAmount} off</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-card">No past membership history</div>
              )}
            </div>
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
                    <div className="followup-bubble">
                      <div className="msg-icon">
                        <MessageSquare size={16} />
                      </div>
                      <p>{f.note}</p>
                    </div>
                    <div className="followup-meta">
                      <span className="timestamp">📅 {formatDate(f.recordedAt)}</span>
                      {f.followUpDate && (
                        <span className="next-date">Next: {formatDate(f.followUpDate)}</span>
                      )}
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
