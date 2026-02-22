// src/components/MastersContent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MastersLayout from '../pages/Masters/MastersLayout';

export default function MastersContent() {
  const [activeMenu, setActiveMenu] = useState('Masters');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ✅ UPDATED: Added Follow Ups route
  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    
    const routes = {
      'Dashboard': '/dashboard',
      'Enquiry': '/enquiry',
      'Follow Ups': '/followups', // ✅ ADD THIS
      'Members': '/members',
      'Attendance': '/attendance',
      'Masters': '/masters',
    };
    
    if (routes[menu]) {
      navigate(routes[menu]);
    }
    
    closeSidebar();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeMenu={activeMenu} 
        onChange={handleMenuChange}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="dashboard-main">
        <div className="dashboard-mobile-header">
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1 className="dashboard-mobile-title">Muscle Time ERP</h1>
        </div>

        <div className="dashboard-content">
          <MastersLayout />
        </div>
      </div>
    </div>
  );
}
