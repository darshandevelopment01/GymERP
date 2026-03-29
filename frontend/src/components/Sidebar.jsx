// src/components/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardCheck,
  ClipboardList,
  Settings,
  LogOut,
  X,
  CalendarClock,
  Tag
} from 'lucide-react';
import logo from '../assets/logo.png';
import { usePermissions } from '../hooks/usePermissions';

// Full menu definition with required permission keys
// permKey: null = always visible | 'masters' = admin only | anything else = checked against panelAccess
const ALL_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, permKey: null },
  { label: 'Enquiry', icon: UserPlus, permKey: 'viewEnquiryTab' },
  { label: 'Follow Ups', icon: CalendarClock, permKey: 'viewFollowUpTab' },
  { label: 'Members', icon: Users, permKey: 'viewMembersTab' },
  { label: 'Offers', icon: Tag, permKey: 'masters' },
  { label: 'Attendance', icon: ClipboardCheck, permKey: 'viewAttendanceTab' },
  { label: 'Plan Master', icon: ClipboardList, permKey: 'viewPlanMaster' },
  { label: 'Masters', icon: Settings, permKey: 'masters' }, // Admin only
];

export default function Sidebar({ activeMenu, onChange, onLogout, isOpen, onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { can } = usePermissions();

  // Filter menu items the current user is allowed to see
  const visibleMenu = ALL_MENU.filter(({ permKey }) => {
    if (permKey === null) return true;       // Dashboard – always visible
    return can(permKey);                     // Check permission
  });

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

        {/* Filtered Menu */}
        <div className="sidebar-menu">
          {visibleMenu.map(({ label, icon: Icon }) => {
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
              {user.userType === 'Admin'
                ? 'Admin'
                : (user.userType === 'User' ? 'Employee' : (user.userType || 'Admin'))}
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
