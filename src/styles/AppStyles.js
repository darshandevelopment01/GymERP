// frontend/src/styles/AppStyles.js
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // Login Screen Styles
  page: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 12,
    justifyContent: 'center',
  },

  pageFullScreen: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 0,
  },

  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingLeft: 80,
  },

  backgroundOverlayFullScreen: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingLeft: 60,
  },

  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 10,
  },

  leftAlignContainer: {
    alignItems: 'flex-start',
    paddingLeft: 0,
    width: 350,
  },

  leftAlignContainerFullScreen: {
    alignItems: 'flex-start',
    width: 320,
  },

  centerAlignMobile: {
    alignItems: 'center',
    paddingLeft: 0,
  },

  outerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.75)',
    padding: 26,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    width: '100%',
  },

  centerBox: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    flexDirection: 'row',
  },

  left: {
    backgroundColor: '#2563EB',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },

  right: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },

  leftText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  rightText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },

  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E7FF',
    marginBottom: 14,
  },

  description: {
    fontSize: 16,
    color: '#F8FAFC',
    lineHeight: 24,
    marginBottom: 20,
  },

  feature: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  bullet: {
    color: '#60A5FA',
    fontSize: 22,
    lineHeight: 24,
    marginRight: 8,
  },

  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#FFFFFF',
  },

  signInButton: {
    marginTop: 8,
    height: 46,
    backgroundColor: '#2563EB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  signInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  signInButtonHover: {
    backgroundColor: '#1D4ED8',
  },

  signInButtonPressed: {
    opacity: 0.9,
  },

  features: {
    marginTop: 8,
  },

  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  subText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 22,
  },

  leftImage: {
    width: '100%',
    height: '100%',
  },

  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },

  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },

  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  sidebarSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 0,
  },

  sidebarItemActive: {
    backgroundColor: '#EFF6FF',
  },

  sidebarText: {
    fontSize: 15,
    color: '#374151',
  },

  sidebarTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },

  sidebarMenu: {
    flex: 1,
  },

  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  userCard: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },

  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  userRole: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 4,
    fontWeight: '500',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },

  logoutText: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '500',
  },

  dashboardContent: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
});

export default styles;
