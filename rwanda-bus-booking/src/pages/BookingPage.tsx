// src/pages/BookingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import BookingForm from '../components/forms/BookingForm';
import { Booking } from '../types/booking';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const BookingPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [scheduleDetails, setScheduleDetails] = useState<{
    scheduleId: string;
    origin: string;
    destination: string;
    departureTime: Date;
    arrivalTime: Date;
    price: number;
    operatorName: string;
    busName: string;
    availableSeats: number;
    passengers: number;
  } | null>(null);

  useEffect(() => {
    // If we have schedule details in location state, use them
    if (location.state && location.state.scheduleId) {
      setScheduleDetails({
        scheduleId: location.state.scheduleId,
        origin: location.state.origin,
        destination: location.state.destination,
        departureTime: new Date(location.state.departureTime),
        arrivalTime: new Date(location.state.arrivalTime),
        price: location.state.price,
        operatorName: location.state.operatorName,
        busName: location.state.busName,
        availableSeats: location.state.availableSeats || 20,
        passengers: location.state.passengers || 1,
      });
      setIsLoading(false);
    } else if (scheduleId) {
      // Otherwise fetch schedule details from API
      fetchScheduleDetails();
    } else {
      // No schedule ID, redirect to home
      showToast('Invalid booking request', 'error');
      navigate('/');
    }
  }, [scheduleId, location.state]);

  const fetchScheduleDetails = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/schedules/${scheduleId}`);
      setScheduleDetails({
        scheduleId: data.id,
        origin: data.origin,
        destination: data.destination,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        price: data.price,
        operatorName: data.operatorName,
        busName: data.busName,
        availableSeats: data.availableSeats,
        passengers: 1, // Default to 1 passenger
      });
    } catch (error) {
      console.error('Failed to fetch schedule details:', error);
      showToast('Failed to load booking details', 'error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingComplete = (completedBooking: Booking) => {
    setBooking(completedBooking);
    setBookingComplete(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {bookingComplete && booking ? (
          // Booking confirmation
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-500 p-6 text-white">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center">Booking Confirmed!</h2>
              <p className="text-center mt-2">Your booking has been successfully processed.</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Details</h3>
                <p className="text-gray-600">Booking Reference: <span className="font-medium">{booking.id}</span></p>
                <p className="text-gray-600">Status: <span className="font-medium">{booking.status}</span></p>
                <p className="text-gray-600">Payment Status: <span className={`font-medium ${booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                  {booking.paymentStatus}
                </span></p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">From: <span className="font-medium">{booking.routeInfo.origin}</span></p>
                    <p className="text-gray-600">To: <span className="font-medium">{booking.routeInfo.destination}</span></p>
                    <p className="text-gray-600">Date: <span className="font-medium">{formatDate(booking.departureTime)}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-600">Departure: <span className="font-medium">{formatTime(booking.departureTime)}</span></p>
                    <p className="text-gray-600">Arrival: <span className="font-medium">{formatTime(booking.arrivalTime)}</span></p>
                    <p className="text-gray-600">Bus: <span className="font-medium">{booking.busInfo.operatorName} - {booking.busInfo.busName}</span></p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Passenger Information</h3>
                <p className="text-gray-600">Name: <span className="font-medium">{booking.userId ? 'Registered User' : booking.guestName}</span></p>
                <p className="text-gray-600">Seat(s): <span className="font-medium">{booking.seatNumbers.join(', ')}</span></p>
                <p className="text-gray-600">Total Price: <span className="font-medium">{booking.totalPrice.toLocaleString()} RWF</span></p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button 
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200"
                >
                  Book Another Trip
                </button>
                
                <button 
                  onClick={() => navigate('/my-bookings')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-200"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Booking form
          <>
            {scheduleDetails && (
              <BookingForm
                scheduleId={scheduleDetails.scheduleId}
                origin={scheduleDetails.origin}
                destination={scheduleDetails.destination}
                departureTime={scheduleDetails.departureTime}
                arrivalTime={scheduleDetails.arrivalTime}
                price={scheduleDetails.price}
                operatorName={scheduleDetails.operatorName}
                busName={scheduleDetails.busName}
                availableSeats={scheduleDetails.availableSeats}
                passengers={scheduleDetails.passengers}
                onBookingComplete={handleBookingComplete}
              />
            )}
            
            {!isAuthenticated && (
              <div className="mt-6 bg-blue-50 border border-blue-300 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Already have an account?</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        <button 
                          onClick={() => navigate('/login', { state: { returnTo: location.pathname } })}
                          className="font-medium underline hover:text-blue-600"
                        >
                          Log in
                        </button>
                        {' '}to book tickets faster and track your bookings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingPage;