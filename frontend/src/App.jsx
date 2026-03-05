import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import MastersScreen from './screens/MastersScreen';
import EnquiryScreen from './screens/EnquiryScreen';
import MemberScreen from './screens/MemberScreen';
import FollowUpsScreen from './screens/FollowUpsScreen';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" /> : children;
}

/**
 * Syncs fresh permissions from /auth/me into localStorage on every app load.
 * This ensures the user's stored permissions are always up-to-date even if:
 *  - They logged in before permissions were added to the login response
 *  - An admin changed their permissions while they were logged in
 */
function usePermissionSync() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...existingUser,
            userType: result.data.userType,
            permissions: result.data.permissions,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // Notify same-tab components that permissions were refreshed
          window.dispatchEvent(new Event('permissions-synced'));
        }
      })
      .catch(() => {
        // Silently ignore – user will just work with cached permissions
      });
  }, []);
}

function App() {
  usePermissionSync(); // Refresh permissions on every app load

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginScreen />
            </PublicRoute>
          }
        />

        {/* Private Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardScreen />
            </PrivateRoute>
          }
        />

        <Route
          path="/masters"
          element={
            <PrivateRoute>
              <MastersScreen />
            </PrivateRoute>
          }
        />

        <Route
          path="/enquiry"
          element={
            <PrivateRoute>
              <EnquiryScreen />
            </PrivateRoute>
          }
        />

        <Route
          path="/members"
          element={
            <PrivateRoute>
              <MemberScreen />
            </PrivateRoute>
          }
        />

        <Route
          path="/followups"
          element={
            <PrivateRoute>
              <FollowUpsScreen />
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* Catch all - 404 redirect */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
