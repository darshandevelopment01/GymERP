// frontend/src/components/LeaveModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, UserCircle } from 'lucide-react';
import attendanceApi from '../services/attendanceApi';

const LeaveModal = ({ onClose, onSuccess }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Get logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser._id) {
      setUser(storedUser);
    } else {
      alert("User session not found. Please login again.");
      onClose();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Session error. Please logout and login again.');

    try {
      await attendanceApi.applyLeave({
        personId: user._id,
        personType: 'employee', // User applying their own leave is treated as an employee leave
        startDate,
        endDate,
        reason
      });
      alert('Leave application submitted for approval');
      onSuccess();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  if (!user) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div className="modal-content" style={{
        background: 'white', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>Apply Leave Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>
              Employee Details
            </label>
            
            <div className="selected-person-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCircle size={32} color="#1ccaa1" />
                <div>
                  <div style={{ fontWeight: '700', color: '#111827' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.employeeCode || user.email}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1ccaa1', fontWeight: '600', padding: '4px 8px', background: 'rgba(28, 202, 161, 0.1)', borderRadius: '6px' }}>
                AUTO-SELECTED
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>Start Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', 
                    border: '2px solid #e5e7eb', boxSizing: 'border-box', outline: 'none'
                  }}
                  required
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>End Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', 
                    border: '2px solid #e5e7eb', boxSizing: 'border-box', outline: 'none'
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>Reason for Leave</label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8', pointerEvents: 'none' }} />
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you are taking leave..."
                style={{ 
                  width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '2px solid #e5e7eb', 
                  minHeight: '100px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', resize: 'vertical'
                }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', marginTop: '0.5rem', justifyContent: 'center', height: '48px',
              fontSize: '1rem', borderRadius: '14px'
            }}
          >
            Submit Leave Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal;
