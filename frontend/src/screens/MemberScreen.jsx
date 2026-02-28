import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MemberMaster from '../pages/Members/MemberMaster';
import '../App.css';

export default function MemberScreen() {
  const [activeMenu, setActiveMenu] = useState('Members');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    
    const routes = {
      'Dashboard': '/dashboard',
      'Masters': '/masters',
      'Enquiry': '/enquiry',
      'Members': '/members',
      'Attendance': '/attendance',
      'Follow Ups': '/followups',
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
          <h1 className="dashboard-mobile-title">Member Management</h1>
        </div>

        <div className="dashboard-content">
          <MemberMaster />
        </div>
      </div>
    </div>
  );
}
