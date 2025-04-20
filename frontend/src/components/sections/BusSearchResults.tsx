// src/components/sections/BusSearchResults.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '../../types/search';
import { useToast } from '../../context/ToastContext';

interface BusSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  passengers: number;
}

const BusSearchResults: React.FC<BusSearchResultsProps> = ({ 
  results, 
  isLoading,
  passengers = 1,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rating'>('price');
  const [filterOperator, setFilterOperator] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No buses found</h3>
        <p className="mt-2 text-base text-gray-600">
          We couldn't find any buses matching your search criteria. Please try different dates or destinations.
        </p>
      </div>
    );
  }

  // Get unique operators for filter
  const operators = [...new Set(results.map(result => result.operatorName))];

  // Sort and filter results
  const sortedAndFilteredResults = [...results]
    .filter(result => !filterOperator || result.operatorName === filterOperator)
    .sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      } else if (sortBy === 'time') {
        return a.duration - b.duration;
      } else {
        return b.rating - a.rating;
      }
    });

  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleBookNow = (result: SearchResult) => {
    // Check if enough seats are available
    if (result.availableSeats < passengers) {
      showToast(`Only ${result.availableSeats} seats available`, 'error');
      return;
    }

    // Navigate to booking page with schedule info
    navigate(`/booking/${result.scheduleId}`, { 
      state: { 
        scheduleId: result.scheduleId,
        origin: result.origin,
        destination: result.destination,
        departureTime: result.departureTime,
        arrivalTime: result.arrivalTime,
        price: result.price,
        operatorName: result.operatorName,
        busName: result.busName,
        passengers
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'time' | 'rating')}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="price">Price: Low to High</option>
              <option value="time">Duration: Shortest First</option>
              <option value="rating">Rating: Best First</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filterOperator" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Operator:
            </label>
            <select
              id="filterOperator"
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Operators</option>
              {operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {sortedAndFilteredResults.map((result) => (
        <div 
          key={result.scheduleId}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">{result.operatorName}</span>
                  <div className="ml-2 flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm text-gray-600">{result.rating.toFixed(1)}</span>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {result.busName}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <div className="text-2xl font-bold">{formatTime(result.departureTime)}</div>
                        <div className="text-sm text-gray-600">{formatDate(result.departureTime)}</div>
                        <div className="text-sm font-medium">{result.origin}</div>
                      </div>
                      
                      <div className="flex-1 px-4">
                        <div className="relative">
                          <div className="h-1 bg-gray-200 w-full absolute top-1/2 transform -translate-y-1/2"></div>
                          <div className="flex justify-between items-center relative">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <div className="text-xs font-medium text-gray-500 absolute top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              {formatDuration(result.duration)}
                            </div>
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold">{formatTime(result.arrivalTime)}</div>
                        <div className="text-sm text-gray-600">{formatDate(result.arrivalTime)}</div>
                        <div className="text-sm font-medium">{result.destination}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.amenities.map((amenity, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {result.price.toLocaleString()} RWF
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {result.availableSeats} seats left
                </div>
                <button
                  onClick={() => handleBookNow(result)}
                  disabled={result.availableSeats < passengers}
                  className={`px-6 py-2 rounded-md font-medium text-white ${
                    result.availableSeats < passengers
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusSearchResults;