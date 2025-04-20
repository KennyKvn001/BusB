// src/pages/UserDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTickets from '../components/sections/UserTickets';
import ReviewForm from '../components/forms/ReviewForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Booking, BookingStatus } from '../types/booking';
import api from '../utils/api';

const UserDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/my-bookings' } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data } = await api.get('/bookings/user');
        setBookings(data);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        showToast('Failed to load your bookings', 'error');
        
        // Fallback mock data
        const mockBookings: Booking[] = Array(5).fill(0).map((_, index) => ({
          id: `booking-${index + 1}`,
          userId: user.id,
          scheduleId: `schedule-${index + 1}`,
          routeInfo: {
            origin: ['Kigali', 'Musanze', 'Gisenyi', 'Huye'][index % 4],
            destination: ['Musanze', 'Gisenyi', 'Huye', 'Kigali'][index % 4],
          },
          busInfo: {
            busId: `bus-${index + 1}`,
            busName: `Bus ${index + 1}`,
            operatorName: ['Virunga Express', 'Volcano Express', 'Kigali Coach'][index % 3],
          },
          departureTime: new Date(Date.now() + (index % 2 === 0 ? 1 : -1) * (1000 * 60 * 60 * 24 * (index + 1))),
          arrivalTime: new Date(Date.now() + (index % 2 === 0 ? 1 : -1) * (1000 * 60 * 60 * 24 * (index + 1)) + (1000 * 60 * 60 * 3)),
          seatNumbers: [index + 1, index + 2],
          totalPrice: 5000 + index * 500,
          status: index === 0 ? BookingStatus.CONFIRMED :
                  index === 1 ? BookingStatus.PENDING :
                  index === 2 ? BookingStatus.COMPLETED :
                  index === 3 ? BookingStatus.CANCELLED : BookingStatus.COMPLETED,
          paymentStatus: index % 3 === 0 ? 'UNPAID' : 'PAID',
          createdAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * index)),
        }));
        
        setBookings(mockBookings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, showToast]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      
      // Update booking status in the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId
            ? { ...booking, status: BookingStatus.CANCELLED }
            : booking
        )
      );
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showToast('Failed to cancel booking', 'error');
      return Promise.reject(error);
    }
  };

  const handleViewBooking = (bookingId: string) => {
    // Navigate to booking details page
    navigate(`/booking/${bookingId}`);
  };

  const handleRateTrip = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedBookingId) return;
    
    try {
      const selectedBooking = bookings.find(b => b.id === selectedBookingId);
      if (!selectedBooking) return;
      
      await api.post('/reviews', {
        bookingId: selectedBookingId,
        routeId: selectedBooking.scheduleId.split('-')[0], // Assuming route ID is part of schedule ID
        operatorId: selectedBooking.busInfo.busId.split('-')[0], // Assuming operator ID is part of bus ID
        rating,
        comment,
      });
      
      showToast('Thank you for your review!', 'success');
      setIsReviewModalOpen(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
      showToast('Failed to submit review', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Manage your bookings and account information</p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'bookings' && (
          <UserTickets
            bookings={bookings}
            isLoading={isLoading}
            onCancelBooking={handleCancelBooking}
            onViewBooking={handleViewBooking}
            onRateTrip={handleRateTrip}
          />
        )}
        
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
            
            {user && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <div className="p-2 bg-gray-50 rounded-md border border-gray-300">
                      {user.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="p-2 bg-gray-50 rounded-md border border-gray-300">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="p-2 bg-gray-50 rounded-md border border-gray-300">
                    {user.phone || 'Not provided'}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Review Modal */}
        {isReviewModalOpen && selectedBookingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Your Trip</h2>
              
              {bookings.find(b => b.id === selectedBookingId) && (
                <div className="mb-4">
                  <p className="text-gray-600">
                    {bookings.find(b => b.id === selectedBookingId)?.routeInfo.origin} →{' '}
                    {bookings.find(b => b.id === selectedBookingId)?.routeInfo.destination}
                  </p>
                  <p className="text-gray-600">
                    {bookings.find(b => b.id === selectedBookingId)?.busInfo.operatorName}
                  </p>
                </div>
              )}
              
              <ReviewForm
                onSubmit={handleSubmitReview}
                onCancel={() => setIsReviewModalOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;