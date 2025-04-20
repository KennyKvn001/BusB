// src/components/sections/UserTickets.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booking, BookingStatus } from '../../types/booking';
import { useToast } from '../../context/ToastContext';

interface UserTicketsProps {
  bookings: Booking[];
  isLoading: boolean;
  onCancelBooking?: (bookingId: string) => Promise<void>;
  onViewBooking?: (bookingId: string) => void;
  onRateTrip?: (bookingId: string) => void;
}

const UserTickets: React.FC<UserTicketsProps> = ({
  bookings,
  isLoading,
  onCancelBooking,
  onViewBooking,
  onRateTrip,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
        <p className="mt-2 text-base text-gray-600">
          You haven't made any bookings yet. Book a bus ticket to get started.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Book Now
        </button>
      </div>
    );
  }

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const departureTime = new Date(booking.departureTime);

    switch (filter) {
      case 'upcoming':
        return booking.status !== BookingStatus.CANCELLED && departureTime > now;
      case 'completed':
        return booking.status === BookingStatus.COMPLETED;
      case 'cancelled':
        return booking.status === BookingStatus.CANCELLED;
      default:
        return true;
    }
  });

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate if a booking is cancellable (e.g., more than 24 hours before departure)
  const isCancellable = (booking: Booking) => {
    const now = new Date();
    const departureTime = new Date(booking.departureTime);
    const hoursDiff = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.COMPLETED &&
      hoursDiff > 24
    );
  };

  // Check if a booking is eligible for review (completed and within 7 days after completion)
  const isReviewable = (booking: Booking) => {
    const now = new Date();
    const arrivalTime = new Date(booking.arrivalTime);
    const daysDiff = (now.getTime() - arrivalTime.getTime()) / (1000 * 60 * 60 * 24);

    return booking.status === BookingStatus.COMPLETED && daysDiff <= 7;
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!onCancelBooking) return;

    try {
      setCancellingId(bookingId);
      await onCancelBooking(bookingId);
      showToast('Booking cancelled successfully', 'success');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showToast('Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All Bookings
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'cancelled'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Cancelled
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">No {filter} bookings found.</p>
        </div>
      ) : (
        filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <span className="text-lg font-bold text-gray-900">{booking.bus.operatorName}</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === BookingStatus.CONFIRMED
                        ? 'bg-green-100 text-green-800'
                        : booking.status === BookingStatus.COMPLETED
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === BookingStatus.CANCELLED
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      booking.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="mr-4">
                          <div className="text-lg font-medium">{formatTime(booking.departureTime)}</div>
                          <div className="text-sm text-gray-600">{formatDate(booking.departureTime)}</div>
                          <div className="text-sm font-medium">{booking.route.origin}</div>
                        </div>

                        <div className="flex-1 px-4">
                          <div className="relative">
                            <div className="h-1 bg-gray-200 w-full absolute top-1/2 transform -translate-y-1/2"></div>
                            <div className="flex justify-between items-center relative">
                              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-lg font-medium">{formatTime(booking.arrivalTime)}</div>
                          <div className="text-sm text-gray-600">{formatDate(booking.arrivalTime)}</div>
                          <div className="text-sm font-medium">{booking.route.destination}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reference:</span> {booking.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Bus:</span> {booking.bus.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Seats:</span> {booking.seatNumbers.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Price:</span> {booking.totalAmount.toLocaleString()} RWF
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col gap-2">
                  {onViewBooking && (
                    <button
                      onClick={() => onViewBooking(booking.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  )}

                  {isReviewable(booking) && onRateTrip && (
                    <button
                      onClick={() => onRateTrip(booking.id)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      Rate Trip
                    </button>
                  )}

                  {isCancellable(booking) && onCancelBooking && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className={`px-4 py-2 text-white rounded-md transition-colors ${
                        cancellingId === booking.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserTickets;