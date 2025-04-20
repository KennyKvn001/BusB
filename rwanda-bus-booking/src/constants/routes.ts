// src/constants/routes.ts

/**
 * Application routes
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  SEARCH: '/search',
  BOOKING: '/booking/:scheduleId',
  LOGIN: '/login',
  REGISTER: '/register',

  // User routes
  USER_DASHBOARD: '/my-bookings',
  USER_PROFILE: '/profile',

  // Operator routes
  OPERATOR_DASHBOARD: '/operator',
  OPERATOR_BUSES: '/operator/buses',
  OPERATOR_ROUTES: '/operator/routes',
  OPERATOR_SCHEDULES: '/operator/schedules',
  OPERATOR_BOOKINGS: '/operator/bookings',
  OPERATOR_REVIEWS: '/operator/reviews',

  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_OPERATORS: '/admin/operators',
  ADMIN_BUSES: '/admin/buses',
  ADMIN_ROUTES: '/admin/routes',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_REVIEWS: '/admin/reviews',

  // Error routes
  NOT_FOUND: '*',
};

/**
 * Popular routes in Rwanda
 */
export const POPULAR_ROUTES = [
  { origin: 'Kigali', destination: 'Musanze' },
  { origin: 'Kigali', destination: 'Gisenyi' },
  { origin: 'Kigali', destination: 'Huye' },
  { origin: 'Kigali', destination: 'Nyagatare' },
  { origin: 'Kigali', destination: 'Rusizi' },
  { origin: 'Musanze', destination: 'Gisenyi' },
  { origin: 'Huye', destination: 'Nyamagabe' },
];

/**
 * Common cities in Rwanda
 */
export const RWANDA_CITIES = [
  'Kigali',
  'Musanze',
  'Gisenyi',
  'Huye',
  'Nyagatare',
  'Rusizi',
  'Nyamata',
  'Nyamagabe',
  'Karongi',
  'Muhanga',
  'Rwamagana',
  'Kayonza',
  'Ngoma',
  'Kirehe',
  'Gicumbi',
];