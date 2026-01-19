// frontend/src/screens/DashboardScreen.js - EXACT ORIGINAL + API
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { logout } from '../services/api';

export default function DashboardScreen({ navigation, route }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const user = route.params?.user; // Get user from navigation

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <DashboardLayout
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
      onLogout={handleLogout}
      user={user} // Pass user
    />
  );
}
