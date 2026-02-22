import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
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
