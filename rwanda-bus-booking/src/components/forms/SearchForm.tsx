// src/components/forms/SearchForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { SearchParams } from '../../types/search';

// Define a schema for form validation
const searchSchema = z.object({
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  departureDate: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, { message: 'Departure date must be today or in the future' }),
  returnDate: z.string().optional(),
  passengers: z.number().int().min(1, 'At least 1 passenger required').max(10, 'Maximum 10 passengers'),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface SearchFormProps {
  onSearch?: (params: SearchParams) => void;
  popular?: {
    origin: string;
    destination: string;
  }[];
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, popular = [] }) => {
  const navigate = useNavigate();
  
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: '',
      destination: '',
      departureDate: new Date().toISOString().split('T')[0], // Today
      returnDate: '',
      passengers: 1,
    },
  });

  // Popular Rwandan destinations
  const popularDestinations = popular.length > 0 ? popular : [
    { origin: 'Kigali', destination: 'Musanze' },
    { origin: 'Kigali', destination: 'Gisenyi' },
    { origin: 'Kigali', destination: 'Butare' },
    { origin: 'Kigali', destination: 'Cyangugu' },
  ];

  const onSubmit = (data: SearchFormData) => {
    const searchParams: SearchParams = {
      origin: data.origin,
      destination: data.destination,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : null,
      passengers: data.passengers,
    };
    
    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Navigate to search results with query params
      const queryParams = new URLSearchParams();
      queryParams.append('origin', data.origin);
      queryParams.append('destination', data.destination);
      queryParams.append('departureDate', data.departureDate);
      if (data.returnDate) queryParams.append('returnDate', data.returnDate);
      queryParams.append('passengers', data.passengers.toString());
      
      navigate(`/search?${queryParams.toString()}`);
    }
  };

  const handlePopularRouteClick = (origin: string, destination: string) => {
    setValue('origin', origin);
    setValue('destination', destination);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Find Your Bus</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              id="origin"
              type="text"
              {...register('origin')}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.origin ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="City of departure"
            />
            {errors.origin && (
              <p className="mt-1 text-sm text-red-600">{errors.origin.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              id="destination"
              type="text"
              {...register('destination')}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.destination ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="City of arrival"
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
              Departure Date
            </label>
            <input
              id="departureDate"
              type="date"
              {...register('departureDate')}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.departureDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.departureDate && (
              <p className="mt-1 text-sm text-red-600">{errors.departureDate.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
              Return Date (Optional)
            </label>
            <input
              id="returnDate"
              type="date"
              {...register('returnDate')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
            Passengers
          </label>
          <Controller
            name="passengers"
            control={control}
            render={({ field }) => (
              <select
                id="passengers"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.passengers ? 'border-red-500' : 'border-gray-300'}`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'passenger' : 'passengers'}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.passengers && (
            <p className="mt-1 text-sm text-red-600">{errors.passengers.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
        >
          Search Buses
        </button>
      </form>
      
      {popularDestinations.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Popular Routes:</p>
          <div className="flex flex-wrap gap-2">
            {popularDestinations.map((route, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePopularRouteClick(route.origin, route.destination)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded-full transition duration-200"
              >
                {route.origin} → {route.destination}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchForm;