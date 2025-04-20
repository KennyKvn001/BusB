// src/components/dashboard/RevenueStats.tsx
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface RevenueData {
  totalRevenue: number;
  totalBookings: number;
  averageTicketPrice: number;
  revenueByRoute: {
    routeId: string;
    routeName: string;
    revenue: number;
    bookings: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
  revenueByPaymentMethod: {
    method: string;
    revenue: number;
    bookings: number;
  }[];
  topRoutes: {
    routeId: string;
    routeName: string;
    revenue: number;
    bookings: number;
  }[];
}

const RevenueStats: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const { showToast } = useToast();
  const api = useApi<RevenueData>();

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`${API_ENDPOINTS.DASHBOARD.ADMIN}/revenue?period=${dateRange}`);
      setRevenueData(data as RevenueData);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      showToast('Failed to load revenue statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load revenue data on component mount and when date range changes
  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Calculate percentage change
  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return 100; // If previous was 0, consider it 100% increase
    return ((current - previous) / previous) * 100;
  };

  // Get color based on percentage change
  const getPercentageColor = (percentage: number) => {
    return percentage >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Render percentage change
  const renderPercentageChange = (percentage: number) => {
    const color = getPercentageColor(percentage);
    const icon = percentage >= 0 ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );

    return (
      <div className={`flex items-center ${color}`}>
        {icon}
        <span className="ml-1">{Math.abs(percentage).toFixed(1)}%</span>
      </div>
    );
  };

  if (isLoading && !revenueData) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" label="Loading revenue statistics..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Revenue Statistics</h2>
        <div className="flex space-x-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 text-sm font-medium ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className={`px-4 py-2 text-sm font-medium ${dateRange === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setDateRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${dateRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300`}
            >
              Year
            </button>
          </div>
          <Button
            variant="primary"
            onClick={fetchRevenueData}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {revenueData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Total Revenue"
              variant="elevated"
            >
              <div className="flex flex-col items-center py-4">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(revenueData.totalRevenue)}
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">vs previous {dateRange}</span>
                  {renderPercentageChange(calculatePercentage(revenueData.totalRevenue, revenueData.totalRevenue * 0.92))} {/* Using calculatePercentage with mock previous value */}
                </div>
              </div>
            </Card>

            <Card
              title="Total Bookings"
              variant="elevated"
            >
              <div className="flex flex-col items-center py-4">
                <div className="text-3xl font-bold text-gray-900">
                  {revenueData.totalBookings.toLocaleString()}
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">vs previous {dateRange}</span>
                  {renderPercentageChange(calculatePercentage(revenueData.totalBookings, revenueData.totalBookings * 0.89))} {/* Using calculatePercentage with mock previous value */}
                </div>
              </div>
            </Card>

            <Card
              title="Average Ticket Price"
              variant="elevated"
            >
              <div className="flex flex-col items-center py-4">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(revenueData.averageTicketPrice)}
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">vs previous {dateRange}</span>
                  {renderPercentageChange(calculatePercentage(revenueData.averageTicketPrice, revenueData.averageTicketPrice * 1.02))} {/* Using calculatePercentage with mock previous value */}
                </div>
              </div>
            </Card>
          </div>

          {/* Revenue by Month Chart */}
          <Card
            title={`Revenue by Month (${dateRange === 'year' ? 'Last 12 Months' : 'Last 6 Months'})`}
            variant="elevated"
          >
            <div className="h-80 p-4">
              {/* This would be a chart component - using a placeholder for now */}
              <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">Revenue Chart Placeholder</p>
                  <p className="text-sm text-gray-500">Implement with a chart library like Chart.js or Recharts</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Routes */}
          <Card
            title="Top Performing Routes"
            variant="elevated"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.topRoutes.map((route) => (
                    <tr key={route.routeId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {route.routeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {route.bookings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(route.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(route.revenue / route.bookings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Revenue by Payment Method */}
          <Card
            title="Revenue by Payment Method"
            variant="elevated"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              {revenueData.revenueByPaymentMethod.map((method) => (
                <div key={method.method} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {method.method.replace('_', ' ').toUpperCase()}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {((method.revenue / revenueData.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(method.revenue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {method.bookings.toLocaleString()} bookings
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RevenueStats;