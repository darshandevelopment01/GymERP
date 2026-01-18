import { StyleSheet, Platform } from 'react-native';
const styles = StyleSheet.create({
  
  page: {
    flex: 1,
    // backgroundColor: '#b8beca',
     backgroundColor: 'transparent',
    padding: 12,
    justifyContent: 'center',
  
  },
  backgroundOverlay: {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.28)', // light glass effect
},
logo: {
  width: 300,          // good balance for login card
  height: 300,
  // resizeMode: 'contain',
  alignSelf: 'center',
  marginTop: -60,
  marginBottom: -50,    // spacing before inputs
  paddingBottom:0,
},
leftAlignContainer: {
  alignItems: 'flex-start', // 👈 LEFT aligned
  paddingLeft: 10,          // 👈 space from left edge (desktop)
},

centerAlignMobile: {
  alignItems: 'center',     // 👈 mobile centered
  paddingLeft: 0,
},
//   outerCenter: {
//   flex: 1,
//   justifyContent: 'center', // 👈 vertical center
//   alignItems: 'center',     // 👈 horizontal center
// },
outerCenter: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

loginCard: {
  // 👈 more transparent
  padding: 32,
  borderRadius: 16,
  // borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.25)',
},
  centerBox: {
  width: '100%',
  maxWidth: 900,
  backgroundColor: '#FFFFFF',
  borderRadius: 16,        // 👈 rounded
  alignSelf: 'center',

  borderWidth: 1,
  borderColor: '#E5E7EB',

  overflow: 'hidden',     // 👈 VERY IMPORTANT
},
  left: {
    // backgroundColor: '#2563EB', // 🔵 blue
    padding: 10,
    // borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    backgroundColor: '#FFFFFF', // ⚪ white
    padding: 10,
    // borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB', // subtle border so white is visible
     paddingHorizontal: 32,  // 👈 UX-friendly horizontal padding
  paddingVertical: 24,    // 👈 vertical breathing space
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
  fontSize: 34,          // ⬆ bigger brand
  fontWeight: '800',
  color: '#FFFFFF',
  marginBottom: 10,
},

subtitle: {
  fontSize: 18,          // ⬆ clearer subtitle
  fontWeight: '600',
  color: '#E0E7FF',
  marginBottom: 14,
},

description: {
  fontSize: 16,          // ⬆ body text for readability
  color: '#F8FAFC',
  lineHeight: 24,        // ⬆ better spacing
  marginBottom: 20,
},

feature: {
  fontSize: 16,          // ⬆ bullet points
  color: '#ffffff',
  marginBottom: 10,
},
featureRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 10,
},

bullet: {
  color: '#60A5FA',   // 🔵 light blue bullet
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
  fontSize: 14,
  fontWeight: '600',
  color: '#dadcdf',
  marginBottom: 8,
},

input: {
   height: 48,                 // ⬆ more comfortable
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 10,           // ⬆ softer corners
  paddingHorizontal: 14,
  fontSize: 15,               // ⬆ readable input text
  backgroundColor: '#FFFFFF',
  color: '#111827',
},
signInButton: {
  marginTop: 16,
  height: 44,
  backgroundColor: '#2563EB', // 🔵 blue
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

signInText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
  letterSpacing: 0.3, 
},

signInButtonHover: {
  backgroundColor: '#1D4ED8', // darker blue on hover
},

signInButtonPressed: {
  opacity: 0.9, // subtle press effect (mobile + web)
},
features: {
  marginTop: 8,
},
welcome: {
  fontSize: 28,          // ⬆ stronger heading
  fontWeight: '700',
  color: '#111827',
  marginBottom: 8,
},

subText: {
  fontSize: 15,          // ⬆ slightly larger for readability
  color: '#6B7280',
  marginBottom: 28,      // ⬆ more space before form
  lineHeight: 22,
},
leftImage: {
  width: '100%',
  height: '100%',
},
dashboardContainer: {
  flex: 1,
  flexDirection: 'row',
},

sidebar: {
  width: 220,
  backgroundColor: '#fefeff',
  paddingVertical: 24,
},

sidebarItem: {
  paddingVertical: 14,
  paddingHorizontal: 20,
},

sidebarItemActive: {
  backgroundColor: '#1F2937',
},

sidebarText: {
  color: '#58595b',
  fontSize: 15,
},

sidebarTextActive: {
  color: '#FFFFFF',
  fontWeight: '600',
},

dashboardContent: {
  flex: 1,
  padding: 24,
  backgroundColor: '#F9FAFB',
},
sidebarHeader: {
  paddingVertical: 24,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#1F2937',
},

sidebarTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#101010',
},

sidebarSubtitle: {
  fontSize: 12,
  color: '#4e4f51',
  marginTop: 2,
},
sidebarItem: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 12,
  marginVertical: 4,
},

sidebarItemActive: {
  backgroundColor: '#EFF6FF',
},

sidebarText: {
  fontSize: 15,
  color: '#1F2937',
},

sidebarTextActive: {
  color: '#2563EB',
  fontWeight: '600',
},
sidebar: {
  width: 260,
  backgroundColor: '#FFFFFF',
  borderRightWidth: 1,
  borderRightColor: '#E5E7EB',
},

/* Header */
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

/* Menu */
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

/* Footer */
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
dashboardContainer: {
  flex: 1,
  flexDirection: 'row',
},

dashboardContent: {
  flex: 1,
  padding: 24,
  backgroundColor: '#F9FAFB',
},

});


export default styles; 