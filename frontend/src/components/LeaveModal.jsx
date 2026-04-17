// frontend/src/components/LeaveModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText } from 'lucide-react';
import attendanceApi from '../services/attendanceApi';
import memberApi from '../services/memberApi';
import { employeeAPI } from '../services/mastersApi';

const LeaveModal = ({ onClose, onSuccess }) => {
  const [type, setType] = useState('member');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedPerson, setSelectedPerson] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      try {
        if (type === 'member') {
          const res = await memberApi.getAll();
          setPeople(res.members || res.data || []);
        } else {
          const res = await employeeAPI.getAll();
          setPeople(res || []);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return alert('Please select a person');

    try {
      await attendanceApi.applyLeave({
        personId: selectedPerson,
        personType: type,
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

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div className="modal-content" style={{
        background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Apply Leave Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Leave For</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setType('member')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: type === 'member' ? '#1ccaa1' : 'white',
                  color: type === 'member' ? 'white' : '#64748b', fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              >Member</button>
              <button 
                type="button" 
                onClick={() => setType('employee')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: type === 'employee' ? '#1ccaa1' : 'white',
                  color: type === 'employee' ? 'white' : '#64748b', fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              >Employee</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Select {type}</label>
            <select 
              value={selectedPerson} 
              onChange={(e) => setSelectedPerson(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
              disabled={loading}
              required
            >
              <option value="">-- Select {type} --</option>
              {people.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.memberId || p.employeeCode})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Reason for Leave</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are taking leave..."
              style={{ 
                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                minHeight: '100px', boxSizing: 'border-box', fontFamily: 'inherit' 
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
          >
            Submit Leave Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal;
