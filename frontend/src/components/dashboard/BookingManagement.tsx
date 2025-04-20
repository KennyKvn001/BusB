// src/components/dashboard/BookingManagement.tsx
import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus } from '../../types/booking';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTime } from '../../utils/date';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const { showToast } = useToast();
  const api = useApi<Booking | Booking[]>();

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.BOOKING.LIST);
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Open view modal
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  // Open cancel confirmation modal
  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  // Cancel a booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      setIsLoading(true);

      await api.post(
        API_ENDPOINTS.BOOKING.CANCEL(selectedBooking.id),
        {},
        undefined,
        { showSuccessToast: true, successMessage: 'Booking cancelled successfully' }
      );

      // Update booking status in the local state
      setBookings(bookings.map(booking =>
        booking.id === selectedBooking.id
          ? { ...booking, status: BookingStatus.CANCELLED }
          : booking
      ));

      setIsCancelModalOpen(false);
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case BookingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case BookingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter bookings by status
  const filteredBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(booking => booking.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Booking Management</h2>
        <div className="flex space-x-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as BookingStatus | 'ALL')}
          >
            <option value="ALL">All Bookings</option>
            <option value={BookingStatus.CONFIRMED}>Confirmed</option>
            <option value={BookingStatus.PENDING}>Pending</option>
            <option value={BookingStatus.CANCELLED}>Cancelled</option>
            <option value={BookingStatus.COMPLETED}>Completed</option>
          </select>
          <Button
            variant="primary"
            onClick={fetchBookings}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && bookings.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading bookings..." />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Alert
          status="info"
          title="No bookings found"
          description={filter === 'ALL' ? 'There are no bookings in the system yet.' : `There are no ${filter.toLowerCase()} bookings.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              title={
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>Booking #{booking.bookingNumber}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              }
              variant="elevated"
              isHoverable
              footer={
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleViewBooking(booking)}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  >
                    View
                  </Button>
                  {booking.status === BookingStatus.CONFIRMED && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancelClick(booking)}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              }
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Passenger:</span>
                  <span className="font-medium">{booking.passengerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{booking.route.origin} to {booking.route.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(booking.departureDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{formatTime(booking.departureTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-medium">{booking.seatNumbers.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{booking.totalAmount.toLocaleString()} RWF</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Booking Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Booking Details"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Booking #{selectedBooking.bookingNumber}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedBooking.status)}`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="border-t border-b border-gray-200 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Passenger Name</p>
                  <p className="font-medium">{selectedBooking.passengerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{selectedBooking.contactPhone || selectedBooking.contactEmail || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium">{selectedBooking.route.origin} to {selectedBooking.route.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus</p>
                  <p className="font-medium">{selectedBooking.bus.name} ({selectedBooking.bus.licensePlate})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Departure Date</p>
                  <p className="font-medium">{formatDate(selectedBooking.departureDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Departure Time</p>
                  <p className="font-medium">{formatTime(selectedBooking.departureTime)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Seat Numbers</p>
                  <p className="font-medium">{selectedBooking.seatNumbers.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Number of Seats</p>
                  <p className="font-medium">{selectedBooking.seatNumbers.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedBooking.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium">{selectedBooking.paymentStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking Date</p>
                  <p className="font-medium">{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg">{selectedBooking.totalAmount.toLocaleString()} RWF</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedBooking.status === BookingStatus.CONFIRMED && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsCancelModalOpen(true);
                  }}
                >
                  Cancel Booking
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Cancellation"
        size="sm"
      >
        <p className="mb-4">
          Are you sure you want to cancel booking #{selectedBooking?.bookingNumber} for {selectedBooking?.passengerName}? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            variant="light"
            onClick={() => setIsCancelModalOpen(false)}
            disabled={isLoading}
          >
            No, Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelBooking}
            isLoading={isLoading}
          >
            Yes, Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BookingManagement;