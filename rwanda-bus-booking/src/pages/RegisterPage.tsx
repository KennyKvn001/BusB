// src/pages/RegisterPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegisterForm from '../components/forms/RegisterForm';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
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
  
  const handleRegisterSuccess = () => {
    // Navigate to the return path after successful registration
    navigate(returnTo);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="mt-2 text-gray-600">Join Rwanda Bus for easy booking and trip management</p>
        </div>
        
        <RegisterForm onSuccess={handleRegisterSuccess} returnPath={returnTo} />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By registering, you agree to Rwanda Bus's{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;