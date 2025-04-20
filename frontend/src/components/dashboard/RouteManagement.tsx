// src/components/dashboard/RouteManagement.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Route } from '../../types/route';
import { routeSchema } from '../../utils/validation';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

type RouteFormData = {
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  price: number;
  popular: boolean;
};

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const api = useApi<Route | Route[]>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0,
      price: 0,
      popular: false,
    },
  });

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.ROUTE.LIST);
      if (Array.isArray(data)) {
        setRoutes(data);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      showToast('Failed to load routes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load routes on component mount
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Open modal for creating a new route
  const handleAddRoute = () => {
    setSelectedRoute(null);
    reset({
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0,
      price: 0,
      popular: false,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing a route
  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    setValue('origin', route.origin);
    setValue('destination', route.destination);
    setValue('distance', route.distance);
    setValue('estimatedDuration', route.estimatedDuration);
    setValue('price', route.price);
    setValue('popular', route.popular);
    setIsModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteModalOpen(true);
  };

  // Create or update a route
  const onSubmit = async (data: RouteFormData) => {
    try {
      setIsLoading(true);

      if (selectedRoute) {
        // Update existing route
        const updatedRoute = await api.put(
          API_ENDPOINTS.ROUTE.UPDATE(selectedRoute.id),
          data,
          undefined,
          { showSuccessToast: true, successMessage: 'Route updated successfully' }
        ) as Route;

        setRoutes(routes.map(route =>
          route.id === selectedRoute.id ? updatedRoute : route
        ));
      } else {
        // Create new route
        const newRoute = await api.post(
          API_ENDPOINTS.ROUTE.CREATE,
          data,
          undefined,
          { showSuccessToast: true, successMessage: 'Route created successfully' }
        ) as Route;

        setRoutes([...routes, newRoute]);
      }

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to save route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a route
  const handleDeleteRoute = async () => {
    if (!selectedRoute) return;

    try {
      setIsLoading(true);

      await api.delete(
        API_ENDPOINTS.ROUTE.DELETE(selectedRoute.id),
        undefined,
        { showSuccessToast: true, successMessage: 'Route deleted successfully' }
      );

      setRoutes(routes.filter(route => route.id !== selectedRoute.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Route Management</h2>
        <Button
          variant="primary"
          onClick={handleAddRoute}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Add Route
        </Button>
      </div>

      {isLoading && routes.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading routes..." />
        </div>
      ) : routes.length === 0 ? (
        <Alert
          status="info"
          title="No routes found"
          description="There are no routes in the system yet. Click the 'Add Route' button to create your first route."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card
              key={route.id}
              title={
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>{route.origin} to {route.destination}</span>
                </div>
              }
              variant="elevated"
              isHoverable
              footer={
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleEditRoute(route)}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(route)}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  >
                    Delete
                  </Button>
                </div>
              }
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{route.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{route.estimatedDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">{route.price.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Popular:</span>
                  <span className="font-medium">{route.popular ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Route Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoute ? 'Edit Route' : 'Add New Route'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Origin"
              {...register('origin')}
              error={errors.origin?.message}
            />
            <Input
              label="Destination"
              {...register('destination')}
              error={errors.destination?.message}
            />
            <Input
              label="Distance (km)"
              type="number"
              {...register('distance', { valueAsNumber: true })}
              error={errors.distance?.message}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              {...register('estimatedDuration', { valueAsNumber: true })}
              error={errors.estimatedDuration?.message}
            />
            <Input
              label="Price (RWF)"
              type="number"
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
            />
            <div className="flex items-center mt-8">
              <input
                type="checkbox"
                id="popular"
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                {...register('popular')}
              />
              <label htmlFor="popular" className="ml-2 block text-sm text-gray-900">
                Mark as popular route
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="light"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              {selectedRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <p className="mb-4">
          Are you sure you want to delete the route from <strong>{selectedRoute?.origin}</strong> to <strong>{selectedRoute?.destination}</strong>? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            variant="light"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteRoute}
            isLoading={isLoading}
          >
            Delete Route
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RouteManagement;