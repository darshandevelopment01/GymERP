import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MemberDetailPage from '../pages/Members/MemberDetailPage';
import AccessDenied from '../components/AccessDenied';
import { usePermissions } from '../hooks/usePermissions';
import '../App.css';

export default function MemberDetailScreen() {
  const [activeMenu, setActiveMenu] = useState('Members');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { can } = usePermissions();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
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
      'Plan Master': '/plan-master',
      'Offers': '/offers',
    };
    if (routes[menu]) navigate(routes[menu]);
    closeSidebar();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

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
          <h1 className="dashboard-mobile-title">Member Profile</h1>
        </div>
        <div className="dashboard-content" style={{ padding: 0 }}>
          {can('viewMembersTab') ? <MemberDetailPage /> : <AccessDenied pageName="Members" />}
        </div>
      </div>
    </div>
  );
}
