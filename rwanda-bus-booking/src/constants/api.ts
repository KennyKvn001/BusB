// src/constants/api.ts

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // User endpoints
  USER: {
    LIST: '/users',
    PROFILE: '/users/profile',
    DETAILS: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Bus endpoints
  BUS: {
    LIST: '/buses',
    DETAILS: (id: string) => `/buses/${id}`,
    CREATE: '/buses',
    UPDATE: (id: string) => `/buses/${id}`,
    DELETE: (id: string) => `/buses/${id}`,
  },

  // Route endpoints
  ROUTE: {
    LIST: '/routes',
    POPULAR: '/routes/popular',
    DETAILS: (id: string) => `/routes/${id}`,
    CREATE: '/routes',
    UPDATE: (id: string) => `/routes/${id}`,
    DELETE: (id: string) => `/routes/${id}`,
  },

  // Schedule endpoints
  SCHEDULE: {
    LIST: '/schedules',
    SEARCH: '/schedules/search',
    DETAILS: (id: string) => `/schedules/${id}`,
    CREATE: '/schedules',
    UPDATE: (id: string) => `/schedules/${id}`,
    DELETE: (id: string) => `/schedules/${id}`,
  },

  // Booking endpoints
  BOOKING: {
    LIST: '/bookings',
    USER_BOOKINGS: '/bookings/user',
    DETAILS: (id: string) => `/bookings/${id}`,
    CREATE: '/bookings',
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
  },

  // Review endpoints
  REVIEW: {
    LIST: '/reviews',
    ROUTE_REVIEWS: '/reviews/route',
    OPERATOR_REVIEWS: '/reviews/operator',
    CREATE: '/reviews',
  },

  // Dashboard endpoints
  DASHBOARD: {
    ADMIN: '/admin/dashboard',
    OPERATOR: '/operator/dashboard',
  },
};

/**
 * API error messages
 */
export const API_ERROR_MESSAGES = {
  DEFAULT: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
};

/**
 * API response status codes
 */
export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
};