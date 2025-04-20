// src/pages/OperatorDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types/user';
import api from '../utils/api';

const OperatorDashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeRoutes: 0,
    pendingBookings: 0,
    totalBookings: 0,
    averageRating: 0,
    totalReviews: 0,
    recentBookings: [],
    recentReviews: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not an operator
  useEffect(() => {
    if (!hasRole([UserRole.OPERATOR])) {
      navigate('/login', { state: { returnTo: '/operator' } });
    }
  }, [hasRole, navigate]);

  // Fetch operator dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/operator/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
        
        // Fallback mock data
        setStats({
          totalBuses: 5,
          activeRoutes: 8,
          pendingBookings: 12,
          totalBookings: 156,
          averageRating: 4.2,
          totalReviews: 87,
          recentBookings: [],
          recentReviews: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  return (
    <DashboardLayout>
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name}. Here's what's happening with your business.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Buses */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-2a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Buses
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.totalBuses}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/operator/buses" className="font-medium text-blue-600 hover:text-blue-900">
                    View all
                  </a>
                </div>
              </div>
            </div>
            
            {/* Active Routes */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Routes
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.activeRoutes}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/operator/routes" className="font-medium text-blue-600 hover:text-blue-900">
                    View all
                  </a>
                </div>
              </div>
            </div>
            
            {/* Pending Bookings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Bookings
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.pendingBookings}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/operator/bookings?status=pending" className="font-medium text-blue-600 hover:text-blue-900">
                    View all
                  </a>
                </div>
              </div>
            </div>
            
            {/* Total Bookings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Bookings
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.totalBookings}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/operator/bookings" className="font-medium text-blue-600 hover:text-blue-900">
                    View all
                  </a>
                </div>
              </div>
            </div>
            
            {/* Rating */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-400 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Rating
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.averageRating.toFixed(1)} / 5.0
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <a href="/operator/reviews" className="font-medium text-blue-600 hover:text-blue-900">
                    View all ({stats.totalReviews})
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-gray-900">Add Bus</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Register a new bus to your fleet
                  </p>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/operator/buses/new" className="font-medium text-blue-600 hover:text-blue-900">
                      Add now
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-gray-900">Add Route</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a new bus route
                  </p>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/operator/routes/new" className="font-medium text-blue-600 hover:text-blue-900">
                      Add now
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-gray-900">Manage Schedule</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your bus schedules
                  </p>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/operator/schedules" className="font-medium text-blue-600 hover:text-blue-900">
                      Manage
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="ml-2 text-lg font-medium text-gray-900">View Reports</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Check business performance
                  </p>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <a href="/operator/reports" className="font-medium text-blue-600 hover:text-blue-900">
                      View
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pending Bookings */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {stats.recentBookings && stats.recentBookings.length > 0 ? (
                    stats.recentBookings.map((booking: any) => (
                      <li key={booking.id}>
                        <a href={`/operator/bookings/${booking.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {booking.origin} to {booking.destination}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.status === 'CONFIRMED' 
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'PENDING' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(booking.departureTime).toLocaleDateString()}
                                </p>
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(booking.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.passengerCount} {booking.passengerCount === 1 ? 'passenger' : 'passengers'}
                              </div>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 sm:px-6 text-center text-sm text-gray-500">
                      No recent bookings found
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-3 text-sm border-t border-gray-200">
                  <a href="/operator/bookings" className="font-medium text-blue-600 hover:text-blue-900">
                    View all bookings
                  </a>
                </div>
              </div>
            </div>
            
            {/* Recent Reviews */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recent Reviews</h2>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {stats.recentReviews && stats.recentReviews.length > 0 ? (
                    stats.recentReviews.map((review: any) => (
                      <li key={review.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {review.userName}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>
                                  {i < review.rating ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {review.comment}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 sm:px-6 text-center text-sm text-gray-500">
                      No recent reviews found
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-3 text-sm border-t border-gray-200">
                  <a href="/operator/reviews" className="font-medium text-blue-600 hover:text-blue-900">
                    View all reviews
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default OperatorDashboardPage;