// src/components/common/Navbar.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    const commonLinks = [
      { to: '/', label: 'Home' },
    ];

    if (!isAuthenticated) {
      // Public user links
      return [
        ...commonLinks,
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
      ];
    }

    if (hasRole([UserRole.ADMIN])) {
      // Admin links
      return [
        ...commonLinks,
        { to: '/admin', label: 'Admin Dashboard' },
      ];
    }

    if (hasRole([UserRole.OPERATOR])) {
      // Operator links
      return [
        ...commonLinks,
        { to: '/operator', label: 'Operator Dashboard' },
      ];
    }

    // Regular user links
    return [
      ...commonLinks,
      { to: '/my-bookings', label: 'My Bookings' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="Rwanda Bus"
              />
              <span className="ml-2 text-xl font-bold">Rwanda Bus</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === link.to
                    ? 'bg-blue-700 text-white'
                    : 'hover:bg-blue-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="mr-2">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === link.to
                  ? 'bg-blue-700 text-white'
                  : 'hover:bg-blue-500'
              }`}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-blue-500">
              <div className="px-2 space-y-1">
                <div className="block px-3 py-2 text-base font-medium">
                  {user?.name}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-600 hover:bg-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;