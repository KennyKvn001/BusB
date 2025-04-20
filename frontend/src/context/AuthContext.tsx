// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token and get user data
          const { data } = await api.get('/auth/me');

          // Transform the user data to match our User type
          const transformedUser = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role.toUpperCase() as UserRole,
            phone: data.phone,
            createdAt: new Date(data.created_at)
          };

          setUser(transformedUser);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // The backend expects username and password for OAuth2 compatibility
      // Create URLSearchParams for OAuth2 compatibility
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      console.log('Attempting login with:', { email, password: '***' });

      // Prevent automatic redirects in case of 401 errors
      const originalInterceptor = api.interceptors.response.handlers[0];
      api.interceptors.response.eject(0);

      try {
        const { data } = await api.post('/auth/login', params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        console.log('Login response:', data);

        // Store the access token
        localStorage.setItem('token', data.access_token);

        // Fetch user data with the new token
        const userResponse = await api.get('/auth/me');
        console.log('User response:', userResponse.data);

        // Transform the user data to match our User type
        const transformedUser = {
          id: userResponse.data.id,
          name: userResponse.data.name,
          email: userResponse.data.email,
          role: userResponse.data.role.toUpperCase() as UserRole,
          phone: userResponse.data.phone,
          createdAt: new Date(userResponse.data.created_at)
        };

        setUser(transformedUser);
      } catch (error: any) {
        console.error('Login API error:', error);

        // Handle specific error status codes
        if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 401:
              setError('Invalid email or password. Please check your credentials and try again.');
              break;
            case 403:
              setError('Your account does not have permission to log in. Please contact support.');
              break;
            case 404:
              setError('Account not found. Please check your email or register for a new account.');
              break;
            case 422:
              setError(data?.detail || 'Invalid input. Please check your email and password format.');
              break;
            case 429:
              setError('Too many login attempts. Please wait a moment and try again later.');
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              setError('Server error. Our team has been notified. Please try again later.');
              break;
            default:
              // Use the error message from the response if available
              if (data?.detail) {
                setError(data.detail);
              } else if (data?.message) {
                setError(data.message);
              } else {
                setError('Login failed. Please try again later.');
              }
          }
        } else if (error.request) {
          // Request was made but no response received (network error)
          setError('Network error. Please check your internet connection and try again.');
        } else {
          // Something else happened while setting up the request
          setError(error.message || 'An unexpected error occurred. Please try again.');
        }

        throw error;
      } finally {
        // Restore the original interceptor
        api.interceptors.response.use(
          originalInterceptor.fulfilled,
          originalInterceptor.rejected
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Error is already set in the inner try/catch
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Registering user with data:', { name, email, password: '***', phone });

      const response = await api.post('/auth/register', { name, email, password, phone });
      console.log('Registration response:', response);

      const { data } = response;

      // The backend returns access_token, not token
      localStorage.setItem('token', data.access_token);

      // Transform the user data to match our User type
      const transformedUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role.toUpperCase() as UserRole,
        phone: data.user.phone,
        createdAt: new Date(data.user.created_at)
      };

      setUser(transformedUser);
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);

      // Handle specific error status codes
      if (err.response) {
        const { status, data } = err.response;

        switch (status) {
          case 409:
            setError('A user with this email already exists. Please use a different email or try logging in.');
            break;
          case 400:
            if (data?.detail?.includes('password')) {
              setError('Password does not meet requirements. Please use a stronger password with at least 8 characters.');
            } else if (data?.detail?.includes('email')) {
              setError('Invalid email format. Please enter a valid email address.');
            } else {
              setError(data?.detail || 'Invalid registration data. Please check your information.');
            }
            break;
          case 422:
            // Validation error
            if (data?.detail) {
              if (Array.isArray(data.detail)) {
                // Handle array of validation errors
                const errorMessages = data.detail.map((error: any) => error.msg || error.message).join('. ');
                setError(`Validation error: ${errorMessages}`);
              } else {
                setError(`Validation error: ${data.detail}`);
              }
            } else {
              setError('Invalid input data. Please check all fields and try again.');
            }
            break;
          case 429:
            setError('Too many registration attempts. Please wait a moment and try again later.');
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setError('Server error. Our team has been notified. Please try again later.');
            break;
          default:
            // Use the error message from the response if available
            if (data?.detail) {
              setError(data.detail);
            } else if (data?.message) {
              setError(data.message);
            } else {
              setError('Registration failed. Please try again later.');
            }
        }
      } else if (err.request) {
        // Request was made but no response received (network error)
        setError('Network error. Please check your internet connection and try again.');
      } else {
        // Something else happened while setting up the request
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};