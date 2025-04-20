// src/components/dashboard/ScheduleManagement.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { formatDate, formatTime } from '../../utils/date';

interface Bus {
  id: string;
  name: string;
  licensePlate: string;
  capacity: number;
  active: boolean;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  price: number;
}

interface Schedule {
  id: string;
  routeId: string;
  route: {
    origin: string;
    destination: string;
  };
  busId: string;
  bus: {
    name: string;
    licensePlate: string;
  };
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

// Create a custom schedule schema that handles string dates
const scheduleFormSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  busId: z.string().min(1, 'Bus is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  arrivalTime: z.string().min(1, 'Arrival time is required'),
  price: z.number().min(500, 'Price must be at least 500 RWF'),
}).refine((data) => {
  const departureTime = new Date(data.departureTime);
  const arrivalTime = new Date(data.arrivalTime);
  return arrivalTime > departureTime;
}, {
  message: 'Arrival time must be after departure time',
  path: ['arrivalTime'],
});

// Define the form data type from the schema
type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED'>('ALL');
  const { showToast } = useToast();
  const api = useApi<Schedule | Schedule[] | Route[] | Bus[]>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      routeId: '',
      busId: '',
      departureTime: '',
      arrivalTime: '',
      price: 0,
    },
  });

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.SCHEDULE.LIST);
      if (Array.isArray(data)) {
        setSchedules(data as Schedule[]);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      showToast('Failed to load schedules', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch routes
  const fetchRoutes = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.ROUTE.LIST);
      if (Array.isArray(data)) {
        setRoutes(data as Route[]);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      showToast('Failed to load routes', 'error');
    }
  };

  // Fetch buses
  const fetchBuses = async () => {
    try {
      const data = await api.get(API_ENDPOINTS.BUS.LIST);
      if (Array.isArray(data)) {
        setBuses(data as Bus[]);
      }
    } catch (error) {
      console.error('Failed to fetch buses:', error);
      showToast('Failed to load buses', 'error');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSchedules();
    fetchRoutes();
    fetchBuses();
  }, []);

  // Open modal for creating a new schedule
  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    reset({
      routeId: '',
      busId: '',
      departureTime: '',
      arrivalTime: '',
      price: 0,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing a schedule
  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);

    // Format date-time strings for input fields
    const departureDateTime = new Date(schedule.departureTime);
    const arrivalDateTime = new Date(schedule.arrivalTime);

    const formatDateTimeForInput = (date: Date) => {
      return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
    };

    setValue('routeId', schedule.routeId);
    setValue('busId', schedule.busId);
    setValue('departureTime', formatDateTimeForInput(departureDateTime));
    setValue('arrivalTime', formatDateTimeForInput(arrivalDateTime));
    setValue('price', schedule.price);

    setIsModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  // Create or update a schedule
  const onSubmit = async (data: ScheduleFormData) => {
    try {
      setIsLoading(true);

      // Prepare data for API - convert string dates to ISO format
      const apiData = {
        ...data,
        departureTime: new Date(data.departureTime).toISOString(),
        arrivalTime: new Date(data.arrivalTime).toISOString()
      };

      if (selectedSchedule) {
        // Update existing schedule
        const updatedSchedule = await api.put(
          API_ENDPOINTS.SCHEDULE.UPDATE(selectedSchedule.id),
          apiData,
          undefined,
          { showSuccessToast: true, successMessage: 'Schedule updated successfully' }
        ) as Schedule;

        setSchedules(schedules.map(schedule =>
          schedule.id === selectedSchedule.id ? updatedSchedule : schedule
        ));
      } else {
        // Create new schedule
        const newSchedule = await api.post(
          API_ENDPOINTS.SCHEDULE.CREATE,
          apiData,
          undefined,
          { showSuccessToast: true, successMessage: 'Schedule created successfully' }
        ) as Schedule;

        setSchedules([...schedules, newSchedule]);
      }

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a schedule
  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      setIsLoading(true);

      await api.delete(
        API_ENDPOINTS.SCHEDULE.DELETE(selectedSchedule.id),
        undefined,
        { showSuccessToast: true, successMessage: 'Schedule deleted successfully' }
      );

      setSchedules(schedules.filter(schedule => schedule.id !== selectedSchedule.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update schedule status
  const handleUpdateStatus = async (schedule: Schedule, newStatus: 'ACTIVE' | 'CANCELLED' | 'COMPLETED') => {
    try {
      setIsLoading(true);

      const updatedSchedule = await api.put(
        API_ENDPOINTS.SCHEDULE.UPDATE(schedule.id),
        { ...schedule, status: newStatus },
        undefined,
        {
          showSuccessToast: true,
          successMessage: `Schedule ${newStatus === 'ACTIVE' ? 'activated' : newStatus === 'CANCELLED' ? 'cancelled' : 'marked as completed'} successfully`
        }
      ) as Schedule;

      setSchedules(schedules.map(s => s.id === schedule.id ? updatedSchedule : s));
    } catch (error) {
      console.error('Failed to update schedule status:', error);
      showToast('Failed to update schedule status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED') => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter schedules by status
  const filteredSchedules = filter === 'ALL'
    ? schedules
    : schedules.filter(schedule => schedule.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Schedule Management</h2>
        <div className="flex space-x-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED')}
          >
            <option value="ALL">All Schedules</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <Button
            variant="primary"
            onClick={handleAddSchedule}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Schedule
          </Button>
        </div>
      </div>

      {isLoading && schedules.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading schedules..." />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Alert
          status="info"
          title="No schedules found"
          description={filter === 'ALL' ? 'There are no schedules in the system yet. Click the "Add Schedule" button to create your first schedule.' : `There are no ${filter.toLowerCase()} schedules.`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSchedules.map((schedule) => (
            <Card
              key={schedule.id}
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{schedule.route.origin} to {schedule.route.destination}</span>
                  </div>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </div>
              }
              variant="elevated"
              isHoverable
              footer={
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleEditSchedule(schedule)}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                  {schedule.status !== 'ACTIVE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(schedule, 'ACTIVE')}
                    >
                      Activate
                    </Button>
                  )}
                  {schedule.status !== 'CANCELLED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(schedule, 'CANCELLED')}
                    >
                      Cancel
                    </Button>
                  )}
                  {schedule.status !== 'COMPLETED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(schedule, 'COMPLETED')}
                    >
                      Complete
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(schedule)}
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
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="font-medium">{formatTime(new Date(schedule.departureTime))}</p>
                    <p className="text-sm text-gray-600">{formatDate(new Date(schedule.departureTime))}</p>
                  </div>
                  <div className="flex-1 px-4 self-center">
                    <div className="relative">
                      <div className="h-1 bg-gray-200 w-full absolute top-1/2 transform -translate-y-1/2"></div>
                      <div className="flex justify-between items-center relative">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arrival</p>
                    <p className="font-medium">{formatTime(new Date(schedule.arrivalTime))}</p>
                    <p className="text-sm text-gray-600">{formatDate(new Date(schedule.arrivalTime))}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Bus</p>
                    <p className="font-medium">{schedule.bus.name}</p>
                    <p className="text-xs text-gray-600">{schedule.bus.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-medium">{schedule.price.toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Available Seats</p>
                    <p className="font-medium">{schedule.availableSeats} / {schedule.totalSeats}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Occupancy</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${((schedule.totalSeats - schedule.availableSeats) / schedule.totalSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('routeId')}
              >
                <option value="">Select a route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} to {route.destination} ({route.distance} km)
                  </option>
                ))}
              </select>
              {errors.routeId && (
                <p className="mt-1 text-sm text-red-600">{errors.routeId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('busId')}
              >
                <option value="">Select a bus</option>
                {buses.filter(bus => bus.active).map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} ({bus.licensePlate}) - {bus.capacity} seats
                  </option>
                ))}
              </select>
              {errors.busId && (
                <p className="mt-1 text-sm text-red-600">{errors.busId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('departureTime')}
              />
              {errors.departureTime && (
                <p className="mt-1 text-sm text-red-600">{errors.departureTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('arrivalTime')}
              />
              {errors.arrivalTime && (
                <p className="mt-1 text-sm text-red-600">{errors.arrivalTime.message}</p>
              )}
            </div>

            <Input
              label="Price (RWF)"
              type="number"
              {...register('price', { valueAsNumber: true })}
              error={errors.price?.message}
            />
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
              {selectedSchedule ? 'Update Schedule' : 'Create Schedule'}
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
          Are you sure you want to delete the schedule from <strong>{selectedSchedule?.route.origin}</strong> to <strong>{selectedSchedule?.route.destination}</strong> on <strong>{selectedSchedule ? formatDate(new Date(selectedSchedule.departureTime)) : ''}</strong>? This action cannot be undone.
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
            onClick={handleDeleteSchedule}
            isLoading={isLoading}
          >
            Delete Schedule
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleManagement;
