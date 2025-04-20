// src/components/dashboard/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, UserRole } from '../../types/user';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

// User form validation schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const api = useApi<User | User[]>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: UserRole.USER,
      password: '',
    },
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.USER.LIST);
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal for creating a new user
  const handleAddUser = () => {
    setSelectedUser(null);
    reset({
      name: '',
      email: '',
      phone: '',
      role: UserRole.USER,
      password: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing a user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('phone', user.phone || '');
    setValue('role', user.role);
    // Don't set password when editing
    setValue('password', '');
    setIsModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Create or update a user
  const onSubmit = async (data: UserFormData) => {
    try {
      setIsLoading(true);

      // Remove empty password field if not provided
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      }

      if (selectedUser) {
        // Update existing user
        const updatedUser = await api.put(
          API_ENDPOINTS.USER.UPDATE(selectedUser.id),
          payload,
          undefined,
          { showSuccessToast: true, successMessage: 'User updated successfully' }
        ) as User;

        setUsers(users.map(user =>
          user.id === selectedUser.id ? updatedUser : user
        ));
      } else {
        // Create new user
        const newUser = await api.post(
          API_ENDPOINTS.USER.CREATE,
          payload,
          undefined,
          { showSuccessToast: true, successMessage: 'User created successfully' }
        ) as User;

        setUsers([...users, newUser]);
      }

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);

      await api.delete(
        API_ENDPOINTS.USER.DELETE(selectedUser.id),
        undefined,
        { showSuccessToast: true, successMessage: 'User deleted successfully' }
      );

      setUsers(users.filter(user => user.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.OPERATOR:
        return 'bg-blue-100 text-blue-800';
      case UserRole.USER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <Button
          variant="primary"
          onClick={handleAddUser}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          Add User
        </Button>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <Alert
          status="info"
          title="No users found"
          description="There are no users in the system yet. Click the 'Add User' button to create your first user."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              title={
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{user.name}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
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
                    onClick={() => handleEditUser(user)}
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
                    onClick={() => handleDeleteClick(user)}
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
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{user.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Name"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone (optional)"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('role')}
              >
                <option value={UserRole.USER}>User</option>
                <option value={UserRole.OPERATOR}>Operator</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
            <Input
              label={selectedUser ? 'Password (leave empty to keep current)' : 'Password'}
              type="password"
              {...register('password')}
              error={errors.password?.message}
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
              {selectedUser ? 'Update User' : 'Create User'}
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
          Are you sure you want to delete the user <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? This action cannot be undone.
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
            onClick={handleDeleteUser}
            isLoading={isLoading}
          >
            Delete User
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;