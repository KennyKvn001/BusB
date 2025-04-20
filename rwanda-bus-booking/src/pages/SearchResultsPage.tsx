// src/pages/SearchResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchForm from '../components/forms/SearchForm';
import BusSearchResults from '../components/sections/BusSearchResults';
import { SearchParams, SearchResult } from '../types/search';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: new Date(),
    passengers: 1,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse query parameters from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const queryParams: SearchParams = {
      origin: query.get('origin') || '',
      destination: query.get('destination') || '',
      departureDate: query.get('departureDate') ? new Date(query.get('departureDate')!) : new Date(),
      returnDate: query.get('returnDate') ? new Date(query.get('returnDate')!) : null,
      passengers: parseInt(query.get('passengers') || '1', 10),
    };
    
    setSearchParams(queryParams);
    
    // Search with the parameters from URL
    if (queryParams.origin && queryParams.destination && queryParams.departureDate) {
      searchBuses(queryParams);
    }
  }, [location.search]);

  const searchBuses = async (params: SearchParams) => {
    try {
      setIsLoading(true);
      
      // Format dates for API
      const formattedDepartureDate = params.departureDate.toISOString().split('T')[0];
      const formattedReturnDate = params.returnDate 
        ? params.returnDate.toISOString().split('T')[0] 
        : undefined;
      
      const { data } = await api.get('/schedules/search', {
        params: {
          origin: params.origin,
          destination: params.destination,
          departureDate: formattedDepartureDate,
          returnDate: formattedReturnDate,
          passengers: params.passengers,
        },
      });
      
      setResults(data);
      
      if (data.length === 0) {
        showToast('No buses found for your search criteria', 'info');
      }
    } catch (error) {
      console.error('Error searching buses:', error);
      showToast('Failed to search for buses', 'error');
      
      // Fallback mock data
      const mockResults: SearchResult[] = Array(5).fill(0).map((_, index) => ({
        scheduleId: `schedule-${index + 1}`,
        routeId: `route-${index + 1}`,
        busId: `bus-${index + 1}`,
        operatorId: `operator-${index % 3 + 1}`,
        operatorName: ['Virunga Express', 'Volcano Express', 'Kigali Coach'][index % 3],
        origin: params.origin,
        destination: params.destination,
        departureTime: new Date(
          new Date().setHours(7 + index * 2, index % 2 === 0 ? 0 : 30, 0, 0)
        ),
        arrivalTime: new Date(
          new Date().setHours(10 + index * 2, index % 2 === 0 ? 30 : 0, 0, 0)
        ),
        duration: 180 + index * 15,
        price: 5000 + index * 500,
        availableSeats: 20 - index * 3,
        busName: `Bus ${index + 1}`,
        amenities: ['WiFi', 'AC', 'USB Charging'].slice(0, index % 3 + 1),
        rating: 4 + (index % 3) * 0.3,
      }));
      
      setResults(mockResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newParams: SearchParams) => {
    // Update URL with new search params
    const query = new URLSearchParams();
    if (newParams.origin) query.append('origin', newParams.origin);
    if (newParams.destination) query.append('destination', newParams.destination);
    if (newParams.departureDate) {
      const formattedDate = newParams.departureDate.toISOString().split('T')[0];
      query.append('departureDate', formattedDate);
    }
    if (newParams.returnDate) {
      const formattedDate = newParams.returnDate.toISOString().split('T')[0];
      query.append('returnDate', formattedDate);
    }
    if (newParams.passengers) query.append('passengers', newParams.passengers.toString());
    
    window.history.pushState({}, '', `${window.location.pathname}?${query.toString()}`);
    
    // Set new params and search
    setSearchParams(newParams);
    searchBuses(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Form Section */}
      <div className="bg-blue-600 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Modify Your Search</h2>
            <SearchForm 
              onSearch={handleSearch} 
              popular={[
                { origin: searchParams.origin || 'Kigali', destination: searchParams.destination || 'Musanze' },
              ]}
            />
          </div>
        </div>
      </div>
      
      {/* Search Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Buses from {searchParams.origin} to {searchParams.destination}
          </h1>
          <p className="text-gray-600">
            {searchParams.departureDate?.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {searchParams.passengers && ` · ${searchParams.passengers} ${
              searchParams.passengers === 1 ? 'passenger' : 'passengers'
            }`}
          </p>
        </div>
        
        <BusSearchResults 
          results={results} 
          isLoading={isLoading} 
          passengers={searchParams.passengers || 1}
        />
      </div>
    </div>
  );
};

export default SearchResultsPage;