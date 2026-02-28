// src/components/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  X, // Close icon
  CalendarClock // Follow ups icon
} from 'lucide-react';
import logo from '../assets/logo.png';

// ✅ ADDED: Follow Ups menu item
const MENU = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Enquiry', icon: UserPlus },
  { label: 'Follow Ups', icon: CalendarClock }, // ✅ NEW
  { label: 'Members', icon: Users },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Masters', icon: Settings },
];

export default function Sidebar({ activeMenu, onChange, onLogout, isOpen, onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Mobile Close Button */}
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Header */}
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title-section">
            <h1 className="sidebar-title">Muscle Time ERP</h1>
            <p className="sidebar-subtitle">Management System</p>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Menu */}
        <div className="sidebar-menu">
          {MENU.map(({ label, icon: Icon }) => {
            const isActive = activeMenu === label;
            return (
              <div
                key={label}
                onClick={() => {
                  onChange(label);
                  onClose();
                }}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
              >
                <Icon size={20} className="sidebar-icon" />
                <span className={`sidebar-text ${isActive ? 'sidebar-text-active' : ''}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card">
            <p className="user-name">{user.name || 'Admin User'}</p>
            <p className="user-email">{user.email || user.phone || 'admin@muscletime.com'}</p>
            <p className="user-role">
              {user.userType === 'user'
                ? (user.designation ? `Employee (${user.designation})` : 'Employee')
                : (user.userType || 'Admin')}
            </p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
