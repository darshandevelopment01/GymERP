import { View, Text } from 'react-native';
import Sidebar from './Sidebar';
import styles from '../styles/AppStyles';

export default function DashboardLayout({
  activeMenu,
  onMenuChange,
  onLogout,
}) {
  return (
    <View style={styles.dashboardContainer}>
      
      {/* Left Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onChange={onMenuChange}
        onLogout={onLogout}
      />

      {/* Right Content */}
      <View style={styles.dashboardContent}>
        {activeMenu === 'Dashboard' && <Text>Dashboard Content</Text>}
        {activeMenu === 'Enquiry' && <Text>Enquiry Content</Text>}
        {activeMenu === 'Members' && <Text>Members Content</Text>}
        {activeMenu === 'Employees' && <Text>Employees Content</Text>}
        {activeMenu === 'Attendance' && <Text>Attendance Content</Text>}
        {activeMenu === 'Reports' && <Text>Reports Content</Text>}
        {activeMenu === 'Masters' && <Text>Masters Content</Text>}
      </View>

    </View>
  );
}
