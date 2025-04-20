// src/hooks/useBusSearch.ts
import { useState, useCallback } from 'react';
import { SearchParams, SearchResult } from '../types/search';
import { API_ENDPOINTS } from '../constants/api';
import useApi from './useApi';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for searching bus schedules
 */
const useBusSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const api = useApi<SearchResult[]>();

  const searchBuses = useCallback(async (params: SearchParams) => {
    if (!params.origin || !params.destination || !params.departureDate) {
      setError('Please provide origin, destination, and departure date');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Format dates for API
      const formattedDepartureDate = params.departureDate instanceof Date
        ? params.departureDate.toISOString().split('T')[0]
        : params.departureDate;

      const formattedReturnDate = params.returnDate instanceof Date
        ? params.returnDate.toISOString().split('T')[0]
        : params.returnDate;

      const queryParams = {
        origin: params.origin,
        destination: params.destination,
        departureDate: formattedDepartureDate,
        returnDate: formattedReturnDate,
        passengers: params.passengers || 1,
      };

      const data = await api.get(API_ENDPOINTS.SCHEDULE.SEARCH, { params: queryParams });

      setResults(data || []);

      if (data && data.length === 0) {
        showToast('No buses found for your search criteria', 'info');
      }

      return data || [];
    } catch (err) {
      console.error('Error searching buses:', err);
      setError('Failed to search for buses. Please try again.');
      showToast('Failed to search for buses', 'error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [api, showToast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    searchBuses,
    clearResults,
  };
};

export default useBusSearch;