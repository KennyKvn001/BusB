import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import OperatorDashboardPage from './pages/OperatorDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { UserRole } from './types/user';
import { useAuth } from './context/AuthContext';

// Route guard component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  if (!hasRole(allowedRoles)) {
    // Redirect to home page if not authorized
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/booking/:scheduleId" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* User Routes */}
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.OPERATOR, UserRole.ADMIN]}>
                  <UserDashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Operator Routes */}
            <Route 
              path="/operator" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.OPERATOR, UserRole.ADMIN]}>
                  <OperatorDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/operator/*" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.OPERATOR, UserRole.ADMIN]}>
                  <OperatorDashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;