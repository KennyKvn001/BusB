// src/components/forms/BookingForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Booking, BookingStatus } from '../../types/booking';
import api from '../../utils/api';

interface BookingFormProps {
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
  onBookingComplete: (booking: Booking) => void;
}

// Define booking validation schema
const bookingSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  paymentMethod: z.enum(['mobile_money', 'card', 'pay_later']),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const BookingForm: React.FC<BookingFormProps> = ({
  scheduleId,
  origin,
  destination,
  departureTime,
  arrivalTime,
  price,
  operatorName,
  busName,
  availableSeats,
  passengers,
  onBookingComplete,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const totalPrice = price * passengers;

  // Define form with default values
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      agreeToTerms: false,
      paymentMethod: 'mobile_money',
    },
  });

  // Generate some available seats for demonstration
  const totalBusSeats = 40; // Assuming bus has 40 seats
  const unavailableSeats = Array.from({ length: totalBusSeats - availableSeats },
    () => Math.floor(Math.random() * totalBusSeats) + 1);

  // Toggle seat selection
  const toggleSeatSelection = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        showToast(`You can only select ${passengers} seats`, 'warning');
      }
    }
  };

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

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);

      // Check if enough seats are selected
      if (selectedSeats.length < passengers) {
        showToast(`Please select ${passengers} seats`, 'error');
        setIsSubmitting(false);
        return;
      }

      // Create booking payload
      const bookingPayload = {
        scheduleId,
        seatNumbers: selectedSeats,
        userData: {
          name: data.name,
          email: data.email,
          phone: data.phone
        },
        paymentMethod: data.paymentMethod
      };

      // Make API call to create booking
      const response = await api.post('/bookings', bookingPayload);

      // Mock successful response
      const mockBooking: Booking = {
        id: `booking-${Date.now()}`,
        bookingNumber: `BK${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user?.id,
        passengerName: data.name,
        contactEmail: data.email,
        contactPhone: data.phone,
        scheduleId,
        route: {
          origin,
          destination
        },
        bus: {
          id: `bus-123`,
          name: busName,
          licensePlate: 'RAB123',
          operatorName
        },
        departureDate: new Date(departureTime),
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        seatNumbers: selectedSeats,
        totalAmount: totalPrice,
        status: BookingStatus.CONFIRMED,
        paymentMethod: data.paymentMethod === 'mobile_money' ? 'mobile_money' :
                       data.paymentMethod === 'card' ? 'credit_card' : 'pay_later',
        paymentStatus: data.paymentMethod === 'pay_later' ? 'UNPAID' : 'PAID',
        createdAt: new Date()
      };

      showToast('Booking successful!', 'success');
      onBookingComplete(response.data || mockBooking);

    } catch (error) {
      console.error('Booking failed:', error);
      showToast('Booking failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Your Booking</h2>

        {/* Trip Summary */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Trip Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">From:</span> {origin}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">To:</span> {destination}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Date:</span> {formatDate(departureTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Departure:</span> {formatTime(departureTime)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Arrival:</span> {formatTime(arrivalTime)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Bus Operator:</span> {operatorName} - {busName}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Passengers:</span> {passengers}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Seat Price:</span> {price.toLocaleString()} RWF
            </p>
            <p className="text-sm font-medium text-gray-900 mt-2">
              <span>Total Price:</span> {totalPrice.toLocaleString()} RWF
            </p>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Select Your Seats</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please select {passengers} seats for your journey
          </p>

          <div className="bg-gray-100 p-4 rounded-md">
            {/* Bus front */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-12 bg-gray-300 rounded-t-lg flex items-center justify-center text-gray-700 font-medium">
                FRONT
              </div>
            </div>

            {/* Seats */}
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              {Array.from({ length: totalBusSeats }, (_, index) => index + 1).map(seatNumber => {
                const isUnavailable = unavailableSeats.includes(seatNumber);
                const isSelected = selectedSeats.includes(seatNumber);

                return (
                  <div key={seatNumber} className="flex justify-center">
                    <button
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => toggleSeatSelection(seatNumber)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        isUnavailable
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                          : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:border-blue-500 text-gray-700'
                      }`}
                    >
                      {seatNumber}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm mr-1"></div>
                <span className="text-xs text-gray-600">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-sm mr-1"></div>
                <span className="text-xs text-gray-600">Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 rounded-sm mr-1"></div>
                <span className="text-xs text-gray-600">Unavailable</span>
              </div>
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected seats: {selectedSeats.sort((a, b) => a - b).join(', ')}
            </div>
          )}
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                disabled={isAuthenticated}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                disabled={isAuthenticated}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g. 078XXXXXXX"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="mobile_money"
                  {...register('paymentMethod')}
                  className="mr-2"
                />
                <span>Mobile Money</span>
              </label>
              <label className="flex p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="card"
                  {...register('paymentMethod')}
                  className="mr-2"
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="pay_later"
                  {...register('paymentMethod')}
                  className="mr-2"
                />
                <span>Pay Later</span>
              </label>
            </div>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('agreeToTerms')}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedSeats.length < passengers}
            className={`w-full p-3 rounded-md font-medium text-white ${
              isSubmitting || selectedSeats.length < passengers
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Complete Booking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;