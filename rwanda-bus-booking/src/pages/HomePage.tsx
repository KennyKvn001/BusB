// src/pages/HomePage.tsx
import React from 'react';
import SearchForm from '../components/forms/SearchForm';
import FeaturedRoutes from '../components/sections/FeaturedRoutes';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search Form */}
      <div className="relative py-10 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pb-8">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
              <span className="block">Travel Across Rwanda</span>
              <span className="block text-blue-200">Safely and Comfortably</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-blue-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Book bus tickets online for all major routes in Rwanda with top operators
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <SearchForm />
          </div>
        </div>
      </div>
      
      {/* Featured Routes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FeaturedRoutes />
      </div>
      
      {/* Why Choose Us Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Rwanda Bus</h2>
            <p className="mt-4 text-xl text-gray-600">The best way to book bus tickets in Rwanda</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Fast Booking</h3>
              <p className="mt-2 text-base text-gray-600">
                Book your bus tickets in less than 5 minutes, anytime and anywhere
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">Secure Payments</h3>
              <p className="mt-2 text-base text-gray-600">
                Pay securely with Mobile Money, Credit Card, or Bank Transfer
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">24/7 Support</h3>
              <p className="mt-2 text-base text-gray-600">
                Our customer service team is available 24/7 to assist you
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popular Operators Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Bus Operators</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Virunga Express', 'Volcano Express', 'Kigali Coach', 'Horizon Express'].map((operator, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 flex items-center justify-center">
              <span className="text-lg font-medium text-gray-800">{operator}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;