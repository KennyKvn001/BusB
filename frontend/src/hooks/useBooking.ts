// src/hooks/useBooking.ts
import { useState, useCallback, useEffect } from 'react';
import { Booking, BookingStatus } from '../types/booking';
import { API_ENDPOINTS } from '../constants/api';
import useApi from './useApi';
import useAuth from './useAuth';
import { useToast } from '../context/ToastContext';

interface CreateBookingParams {
  scheduleId: string;
  seatNumbers: number[];
  paymentMethod: 'mobile_money' | 'credit_card' | 'pay_later';
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

/**
 * Custom hook for managing bookings
 */
const useBooking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const api = useApi<Booking | Booking[]>();

  // Fetch user bookings
  const fetchUserBookings = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await api.get(API_ENDPOINTS.BOOKING.USER_BOOKINGS);

      if (Array.isArray(data)) {
        setBookings(data);
        return data;
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load your bookings');
      showToast('Failed to load your bookings', 'error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated, showToast]);

  // Create a new booking
  const createBooking = useCallback(async (params: CreateBookingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const bookingPayload = {
        scheduleId: params.scheduleId,
        seatNumbers: params.seatNumbers,
        paymentMethod: params.paymentMethod,
        // Include guest info only if not authenticated
        ...(!isAuthenticated && {
          guestName: params.guestName,
          guestEmail: params.guestEmail,
          guestPhone: params.guestPhone,
        }),
      };

      const data = await api.post(
        API_ENDPOINTS.BOOKING.CREATE,
        bookingPayload,
        undefined,
        { showSuccessToast: true, successMessage: 'Booking successful!' }
      ) as Booking;

      // Update bookings list if user is authenticated
      if (isAuthenticated) {
        setBookings((prev) => [data, ...prev]);
      }

      return data;
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking');
      showToast('Failed to create booking', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated, showToast]);

  // Cancel a booking
  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post(
        API_ENDPOINTS.BOOKING.CANCEL(bookingId),
        {},
        undefined,
        { showSuccessToast: true, successMessage: 'Booking cancelled successfully' }
      );

      // Update booking status in the local state
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: BookingStatus.CANCELLED }
            : booking
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError('Failed to cancel booking');
      showToast('Failed to cancel booking', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [api, showToast]);

  // Get booking details
  const getBookingDetails = useCallback(async (bookingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.get(API_ENDPOINTS.BOOKING.DETAILS(bookingId)) as Booking;
      return data;
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
      setError('Failed to load booking details');
      showToast('Failed to load booking details', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [api, showToast]);

  // Load bookings when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBookings();
    }
  }, [isAuthenticated, fetchUserBookings]);

  return {
    bookings,
    isLoading,
    error,
    fetchUserBookings,
    createBooking,
    cancelBooking,
    getBookingDetails,
  };
};

export default useBooking;