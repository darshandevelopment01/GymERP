// src/components/LoginCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import bg from '../assets/bg3.png';

export default function LoginCard() {
  const [mode, setMode] = useState('login'); // 'login', 'forgot', 'reset'

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot / Reset states
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Allow user to login with email or phone by using the identifier endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please check if the server is running.');
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('OTP has been generated. Please check the terminal logs (mock email/SMS).');
        setMode('reset');
      } else {
        setError(data.message || data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error.');
      console.error('Forgot password error:', error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Password has been successfully updated! You can now log in.');
        setMode('login');
      } else {
        setError(data.message || data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error.');
      console.error('Reset password error:', error);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="overlay">
        <div className="login-card">
          <img src={logo} alt="Logo" className="logo" />

          {error && <div className="error-message">{error}</div>}
          {success && (
            <div
              className="success-message"
              style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="label">Email Address / Phone Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your email or phone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '8px' }}>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('forgot');
                    setError('');
                    setSuccess('');
                  }}
                  style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}
                >
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="sign-in-button">
                <span className="sign-in-text">Sign In</span>
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                Enter your registered email or phone number to receive a 6-digit OTP.
              </p>
              <div className="input-group">
                <label className="label">Email or Phone Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="name@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="sign-in-button">
                <span className="sign-in-text">Send OTP</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}
                >
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                We sent a code to <strong>{identifier}</strong>
              </p>
              <div className="input-group">
                <label className="label">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="sign-in-button">
                <span className="sign-in-text">Reset Password</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}
                >
                  Cancel
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
