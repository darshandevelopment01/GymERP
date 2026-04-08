import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

const ComingSoon = ({ title = "Attendance" }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'transparent',
      color: '#ffffff'
    }}>
      <div style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: '2.5rem',
        borderRadius: '50%',
        marginBottom: '2rem',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)'
      }}>
        <Clock size={80} color="#3b82f6" strokeWidth={1.5} />
      </div>
      
      <h1 style={{
        fontSize: '3rem',
        fontWeight: '800',
        marginBottom: '1rem',
        letterSpacing: '-1px',
        background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Coming Soon
      </h1>
      
      <p style={{
        fontSize: '1.25rem',
        color: '#94a3b8',
        maxWidth: '500px',
        lineHeight: '1.6',
        marginBottom: '3rem'
      }}>
        Our engineering team is working hard to bring you a seamless <strong>{title}</strong> tracking experience. Stay tuned for something amazing!
      </p>
      
      <button 
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 28px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>
    </div>
  );
};

export default ComingSoon;
