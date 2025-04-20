// src/components/dashboard/BusManagement.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bus } from '../../types/bus';
import { busSchema } from '../../utils/validation';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

type BusFormData = {
  name: string;
  licensePlate: string;
  capacity: number;
  amenities: string[];
  active: boolean;
};

const AMENITIES_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'usb', label: 'USB Charging' },
  { id: 'tv', label: 'TV/Entertainment' },
  { id: 'toilet', label: 'Toilet' },
  { id: 'refreshments', label: 'Refreshments' },
  { id: 'reclining_seats', label: 'Reclining Seats' },
  { id: 'legroom', label: 'Extra Legroom' },
];

const BusManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const api = useApi<Bus | Bus[]>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      name: '',
      licensePlate: '',
      capacity: 30,
      amenities: [],
      active: true,
    },
  });

  // Fetch buses
  const fetchBuses = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.BUS.LIST);
      if (Array.isArray(data)) {
        setBuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error);
      showToast('Failed to load buses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load buses on component mount
  useEffect(() => {
    fetchBuses();
  }, []);

  // Open modal for creating a new bus
  const handleAddBus = () => {
    setSelectedBus(null);
    reset({
      name: '',
      licensePlate: '',
      capacity: 30,
      amenities: [],
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing a bus
  const handleEditBus = (bus: Bus) => {
    setSelectedBus(bus);
    setValue('name', bus.name);
    setValue('licensePlate', bus.licensePlate);
    setValue('capacity', bus.capacity);
    setValue('amenities', bus.amenities);
    setValue('active', bus.active);
    setIsModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (bus: Bus) => {
    setSelectedBus(bus);
    setIsDeleteModalOpen(true);
  };

  // Create or update a bus
  const onSubmit = async (data: BusFormData) => {
    try {
      setIsLoading(true);

      if (selectedBus) {
        // Update existing bus
        const updatedBus = await api.put(
          API_ENDPOINTS.BUS.UPDATE(selectedBus.id),
          data,
          undefined,
          { showSuccessToast: true, successMessage: 'Bus updated successfully' }
        ) as Bus;

        setBuses(buses.map(bus =>
          bus.id === selectedBus.id ? updatedBus : bus
        ));
      } else {
        // Create new bus
        const newBus = await api.post(
          API_ENDPOINTS.BUS.CREATE,
          data,
          undefined,
          { showSuccessToast: true, successMessage: 'Bus created successfully' }
        ) as Bus;

        setBuses([...buses, newBus]);
      }

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to save bus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a bus
  const handleDeleteBus = async () => {
    if (!selectedBus) return;

    try {
      setIsLoading(true);

      await api.delete(
        API_ENDPOINTS.BUS.DELETE(selectedBus.id),
        undefined,
        { showSuccessToast: true, successMessage: 'Bus deleted successfully' }
      );

      setBuses(buses.filter(bus => bus.id !== selectedBus.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete bus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle bus active status
  const handleToggleActive = async (bus: Bus) => {
    try {
      const updatedBus = await api.put(
        API_ENDPOINTS.BUS.UPDATE(bus.id),
        { ...bus, active: !bus.active },
        undefined,
        {
          showSuccessToast: true,
          successMessage: `Bus ${!bus.active ? 'activated' : 'deactivated'} successfully`
        }
      ) as Bus;

      setBuses(buses.map(b => b.id === bus.id ? updatedBus : b));
    } catch (error) {
      console.error('Failed to update bus status:', error);
      showToast('Failed to update bus status', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bus Management</h2>
        <Button
          variant="primary"
          onClick={handleAddBus}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Add Bus
        </Button>
      </div>

      {isLoading && buses.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading buses..." />
        </div>
      ) : buses.length === 0 ? (
        <Alert
          status="info"
          title="No buses found"
          description="There are no buses in the system yet. Click the 'Add Bus' button to create your first bus."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buses.map((bus) => (
            <Card
              key={bus.id}
              title={
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{bus.name}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${bus.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {bus.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              }
              variant="elevated"
              isHoverable
              footer={
                <div className="flex justify-end space-x-2">
                  <Button
                    variant={bus.active ? 'warning' : 'success'}
                    size="sm"
                    onClick={() => handleToggleActive(bus)}
                  >
                    {bus.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleEditBus(bus)}
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
                    onClick={() => handleDeleteClick(bus)}
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
                  <span className="text-gray-600">License Plate:</span>
                  <span className="font-medium">{bus.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{bus.capacity} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Operator:</span>
                  <span className="font-medium">{bus.operatorName}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600 block mb-1">Amenities:</span>
                  <div className="flex flex-wrap gap-1">
                    {bus.amenities.length > 0 ? (
                      bus.amenities.map((amenity) => (
                        <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {AMENITIES_OPTIONS.find(opt => opt.id === amenity)?.label || amenity}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No amenities</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Bus Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBus ? 'Edit Bus' : 'Add New Bus'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bus Name"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="License Plate"
              {...register('licensePlate')}
              error={errors.licensePlate?.message}
            />
            <Input
              label="Capacity (seats)"
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              error={errors.capacity?.message}
            />
            <div className="flex items-center mt-8">
              <input
                type="checkbox"
                id="active"
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                {...register('active')}
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Bus is active and available for booking
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Controller
                control={control}
                name="amenities"
                render={({ field }) => (
                  <>
                    {AMENITIES_OPTIONS.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          id={`amenity-${option.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={field.value.includes(option.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, option.id]);
                            } else {
                              field.onChange(field.value.filter((value) => value !== option.id));
                            }
                          }}
                        />
                        <label htmlFor={`amenity-${option.id}`} className="ml-2 block text-sm text-gray-900">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </>
                )}
              />
            </div>
            {errors.amenities && (
              <p className="mt-1 text-sm text-red-600">{errors.amenities.message}</p>
            )}
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
              {selectedBus ? 'Update Bus' : 'Create Bus'}
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
          Are you sure you want to delete the bus <strong>{selectedBus?.name}</strong> with license plate <strong>{selectedBus?.licensePlate}</strong>? This action cannot be undone.
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
            onClick={handleDeleteBus}
            isLoading={isLoading}
          >
            Delete Bus
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BusManagement;