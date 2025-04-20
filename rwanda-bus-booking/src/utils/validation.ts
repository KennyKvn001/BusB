// src/utils/validation.ts
import * as z from 'zod';


// Phone number validation regex (Rwanda format)
const RWANDA_PHONE_REGEX = /^(\+?250|0)?7[2389]\d{7}$/;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Validation schema for registration form
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(RWANDA_PHONE_REGEX, 'Please enter a valid Rwanda phone number')
    .optional(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Validation schema for search form
 */
export const searchSchema = z.object({
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  departureDate: z.date({
    required_error: 'Departure date is required',
    invalid_type_error: 'Departure date is invalid',
  }),
  returnDate: z.date().optional().nullable(),
  passengers: z.number().min(1, 'At least 1 passenger is required').max(10, 'Maximum 10 passengers allowed'),
});

/**
 * Validation schema for booking form
 */
export const bookingSchema = z.object({
  name: z.string().min(2, 'Name is required').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z
    .string()
    .regex(RWANDA_PHONE_REGEX, 'Please enter a valid Rwanda phone number')
    .optional(),
  selectedSeats: z.array(z.number()).min(1, 'Please select at least one seat'),
  paymentMethod: z.enum(['mobile_money', 'credit_card', 'pay_later']),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

/**
 * Validation schema for review form
 */
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(500, 'Comment must be less than 500 characters'),
});

/**
 * Validation schema for bus form (admin/operator)
 */
export const busSchema = z.object({
  name: z.string().min(2, 'Bus name is required'),
  licensePlate: z.string().min(5, 'License plate is required'),
  capacity: z.number().min(10, 'Capacity must be at least 10').max(60, 'Capacity must be less than 60'),
  amenities: z.array(z.string()),
  active: z.boolean(),
});

/**
 * Validation schema for route form (admin/operator)
 */
export const routeSchema = z.object({
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  distance: z.number().min(1, 'Distance is required'),
  estimatedDuration: z.number().min(10, 'Duration must be at least 10 minutes'),
  price: z.number().min(500, 'Price must be at least 500 RWF'),
  popular: z.boolean(),
});

/**
 * Validation schema for schedule form (admin/operator)
 */
export const scheduleSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  busId: z.string().min(1, 'Bus is required'),
  departureTime: z.date({
    required_error: 'Departure time is required',
    invalid_type_error: 'Departure time is invalid',
  }),
  arrivalTime: z.date({
    required_error: 'Arrival time is required',
    invalid_type_error: 'Arrival time is invalid',
  }),
  price: z.number().min(500, 'Price must be at least 500 RWF'),
}).refine((data) => data.arrivalTime > data.departureTime, {
  message: 'Arrival time must be after departure time',
  path: ['arrivalTime'],
});