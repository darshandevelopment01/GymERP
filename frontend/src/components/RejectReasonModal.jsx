import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';

const RejectReasonModal = ({ onClose, onConfirm, employeeName }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    onConfirm(reason);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100
    }}>
      <div className="modal-content" style={{
        background: 'white', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '450px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '12px' }}>
              <AlertCircle size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>Reject Leave</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Please provide a reason for rejecting <strong>{employeeName}</strong>'s leave request. This will be visible to the employee.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.75rem' }}>
              Rejection Reason
            </label>
            <div style={{ position: 'relative' }}>
              <MessageSquare size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the reason for rejection..."
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="btn-reject"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                fontWeight: '640',
                cursor: 'pointer',
                opacity: (isSubmitting || !reason.trim()) ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReasonModal;
