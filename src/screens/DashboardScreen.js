import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardScreen({ navigation }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  const handleLogout = () => {
    navigation.replace('Login'); // 👈 back to LoginCard
  };

  return (
    <DashboardLayout
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
      onLogout={handleLogout}
    />
  );
}
