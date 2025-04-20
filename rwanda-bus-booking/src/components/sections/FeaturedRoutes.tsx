// src/components/sections/FeaturedRoutes.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Route } from '../../types/route';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const FeaturedRoutes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFeaturedRoutes = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/routes/popular');

        // Transform API response to match our Route type
        const transformedRoutes = data.map((route: any) => ({
          id: route.id,
          origin: route.start_location.name,
          destination: route.end_location.name,
          distance: route.distance,
          estimatedDuration: route.duration,
          popular: route.is_popular,
          price: route.price,
          operatorId: route.bus_id,
          operatorName: 'Bus Operator' // We don't have this info in the API response
        }));

        setRoutes(transformedRoutes);
      } catch (error) {
        console.error('Failed to fetch featured routes:', error);
        showToast('Failed to load popular routes', 'error');
        // Fallback data in case API fails
        setRoutes([
          {
            id: '1',
            origin: 'Kigali',
            destination: 'Musanze',
            distance: 106,
            estimatedDuration: 120,
            popular: true,
            price: 5000,
            operatorId: '1',
            operatorName: 'Virunga Express'
          },
          {
            id: '2',
            origin: 'Kigali',
            destination: 'Gisenyi',
            distance: 157,
            estimatedDuration: 180,
            popular: true,
            price: 6000,
            operatorId: '2',
            operatorName: 'Volcano Express'
          },
          {
            id: '3',
            origin: 'Kigali',
            destination: 'Butare',
            distance: 135,
            estimatedDuration: 150,
            popular: true,
            price: 4500,
            operatorId: '1',
            operatorName: 'Virunga Express'
          },
          {
            id: '4',
            origin: 'Kigali',
            destination: 'Cyangugu',
            distance: 225,
            estimatedDuration: 240,
            popular: true,
            price: 8500,
            operatorId: '3',
            operatorName: 'Kigali Coach'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedRoutes();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format time (minutes to hours and minutes)
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format price in Rwandan Francs
  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Popular Destinations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            {/* Image placeholder - could be replaced with actual route images */}
            <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                {route.origin} → {route.destination}
              </div>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">{route.operatorName}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {formatDuration(route.estimatedDuration)}
                </span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">{route.distance} km</span>
                <span className="text-lg font-bold text-green-600">{formatPrice(route.price)}</span>
              </div>

              <Link
                to={`/search?origin=${route.origin}&destination=${route.destination}&departureDate=${new Date().toISOString().split('T')[0]}`}
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                View Schedule
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedRoutes;