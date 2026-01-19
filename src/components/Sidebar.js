// frontend/src/components/Sidebar.js - EXACT ORIGINAL + user prop
import { View, Text, Pressable } from 'react-native';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UserCog,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react-native';
import styles from '../styles/AppStyles';

const MENU = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Enquiry', icon: UserPlus },
  { label: 'Members', icon: Users },
  { label: 'Employees', icon: UserCog },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Masters', icon: Settings },
];

export default function Sidebar({ activeMenu, onChange, onLogout, user }) { // Add user prop
  return (
    <View style={styles.sidebar}>
      {/* YOUR EXACT ORIGINAL HEADER */}
      <View style={styles.sidebarHeader}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>GE</Text>
        </View>
        <View>
          <Text style={styles.sidebarTitle}>GymERP</Text>
          <Text style={styles.sidebarSubtitle}>Management System</Text>
        </View>
      </View>

      <View style={styles.sidebarDivider} />

      {/* YOUR EXACT ORIGINAL MENU */}
      <View style={styles.sidebarMenu}>
        {MENU.map(({ label, icon: Icon }) => {
          const active = activeMenu === label;
          return (
            <Pressable
              key={label}
              onPress={() => onChange(label)}
              style={[
                styles.sidebarItem,
                active && styles.sidebarItemActive,
              ]}
            >
              <Icon size={20} color={active ? '#2563EB' : '#374151'} />
              <Text style={[styles.sidebarText, active && styles.sidebarTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* YOUR EXACT ORIGINAL FOOTER - Just show real user data */}
      <View style={styles.sidebarFooter}>
        <View style={styles.userCard}>
          <Text style={styles.userName}>{user?.name || 'Super Admin'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'admin@gym.com'}</Text>
          <Text style={styles.userRole}>
            {user?.userType === 'gym_owner' ? 'Gym Owner' : 'Super Admin'}
          </Text>
        </View>

        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
