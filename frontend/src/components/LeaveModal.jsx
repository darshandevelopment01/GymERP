// frontend/src/components/LeaveModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, FileText, Search, UserCircle } from 'lucide-react';
import attendanceApi from '../services/attendanceApi';
import memberApi from '../services/memberApi';

const LeaveModal = ({ onClose, onSuccess }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedPerson, setSelectedPerson] = useState(null); // Full person object
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      try {
        const res = await memberApi.getAll();
        setPeople(res.members || res.data || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return people.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.memberId?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5); // Limit to top 5 matches
  }, [people, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return alert('Please select a member');

    try {
      await attendanceApi.applyLeave({
        personId: selectedPerson._id,
        personType: 'member',
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
        background: 'white', padding: '2rem', borderRadius: '24px', width: '90%', maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>Apply Member Leave</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>
              Select Member
            </label>
            
            {!selectedPerson ? (
              <div className="search-select-container">
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text"
                    placeholder="Search by name or member ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    style={{ 
                      width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', 
                      border: '2px solid #e5e7eb', outline: 'none', fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    autoComplete="off"
                  />
                </div>
                
                {showResults && searchQuery.trim() && (
                  <div className="search-select-results">
                    {filteredPeople.length > 0 ? (
                      filteredPeople.map(p => (
                        <div 
                          key={p._id} 
                          className="search-select-item"
                          onClick={() => {
                            setSelectedPerson(p);
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <div style={{ fontWeight: '600' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {p.memberId}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                        No members found
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="selected-person-chip">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCircle size={32} color="#1ccaa1" />
                  <div>
                    <div style={{ fontWeight: '700', color: '#111827' }}>{selectedPerson.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedPerson.memberId}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
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
                placeholder="Explain why the member is taking leave..."
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
            disabled={!selectedPerson}
          >
            Submit Leave Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal;
