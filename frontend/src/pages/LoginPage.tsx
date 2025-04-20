// src/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return path from query params or location state
  const queryParams = new URLSearchParams(location.search);
  const returnTo = queryParams.get('returnTo') || 
    (location.state as any)?.returnTo || '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, returnTo]);
  
  const handleLoginSuccess = () => {
    // Navigate to the return path after successful login
    navigate(returnTo);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Log in to book tickets and manage your trips</p>
        </div>
        
        <LoginForm onSuccess={handleLoginSuccess} returnPath={returnTo} />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By logging in, you agree to Rwanda Bus's{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;