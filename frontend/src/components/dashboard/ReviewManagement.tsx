// src/components/dashboard/ReviewManagement.tsx
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../constants/api';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

interface Review {
  id: string;
  userId: string;
  userName: string;
  routeId: string;
  routeName: string;
  operatorId: string;
  operatorName: string;
  rating: number;
  comment: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';
  createdAt: Date;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN' | 'FLAGGED'>('ALL');
  const { showToast } = useToast();
  const api = useApi<Review | Review[]>();

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await api.get(API_ENDPOINTS.REVIEW.LIST);
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      showToast('Failed to load reviews', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Open view modal
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsViewModalOpen(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteModalOpen(true);
  };

  // Delete a review
  const handleDeleteReview = async () => {
    if (!selectedReview) return;

    try {
      setIsLoading(true);

      await api.delete(
        `/reviews/${selectedReview.id}`,
        undefined,
        { showSuccessToast: true, successMessage: 'Review deleted successfully' }
      );

      setReviews(reviews.filter(review => review.id !== selectedReview.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update review status
  const handleUpdateStatus = async (review: Review, newStatus: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED') => {
    try {
      setIsLoading(true);

      const updatedReview = await api.put(
        `/reviews/${review.id}`,
        { ...review, status: newStatus },
        undefined,
        {
          showSuccessToast: true,
          successMessage: `Review ${newStatus === 'PUBLISHED' ? 'published' : newStatus === 'HIDDEN' ? 'hidden' : 'flagged'} successfully`
        }
      ) as Review;

      setReviews(reviews.map(r => r.id === review.id ? updatedReview : r));

      if (selectedReview && selectedReview.id === review.id) {
        setSelectedReview(updatedReview);
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
      showToast('Failed to update review status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED') => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'HIDDEN':
        return 'bg-gray-100 text-gray-800';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Filter reviews by status
  const filteredReviews = filter === 'ALL'
    ? reviews
    : reviews.filter(review => review.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Review Management</h2>
        <div className="flex space-x-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'PUBLISHED' | 'HIDDEN' | 'FLAGGED')}
          >
            <option value="ALL">All Reviews</option>
            <option value="PUBLISHED">Published</option>
            <option value="HIDDEN">Hidden</option>
            <option value="FLAGGED">Flagged</option>
          </select>
          <Button
            variant="primary"
            onClick={fetchReviews}
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

      {isLoading && reviews.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" label="Loading reviews..." />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Alert
          status="info"
          title="No reviews found"
          description={filter === 'ALL' ? 'There are no reviews in the system yet.' : `There are no ${filter.toLowerCase()} reviews.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <Card
              key={review.id}
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{review.userName}</span>
                  </div>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(review.status)}`}>
                    {review.status}
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
                    onClick={() => handleViewReview(review)}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    }
                  >
                    View
                  </Button>
                  {review.status !== 'PUBLISHED' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateStatus(review, 'PUBLISHED')}
                    >
                      Publish
                    </Button>
                  )}
                  {review.status !== 'HIDDEN' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(review, 'HIDDEN')}
                    >
                      Hide
                    </Button>
                  )}
                  {review.status !== 'FLAGGED' && (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleUpdateStatus(review, 'FLAGGED')}
                    >
                      Flag
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(review)}
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-gray-700 line-clamp-3">{review.comment}</p>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Route:</span> {review.routeName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Operator:</span> {review.operatorName}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Review Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Review Details"
        size="md"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{selectedReview.userName}</h3>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedReview.status)}`}>
                  {selectedReview.status}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(selectedReview.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="border-t border-b border-gray-200 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <div className="flex items-center">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2">{selectedReview.rating}/5</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Comment</p>
                <p className="mt-1">{selectedReview.comment}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium">{selectedReview.routeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Operator</p>
                  <p className="font-medium">{selectedReview.operatorName}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedReview.status !== 'PUBLISHED' && (
                <Button
                  variant="success"
                  onClick={() => {
                    handleUpdateStatus(selectedReview, 'PUBLISHED');
                    setIsViewModalOpen(false);
                  }}
                >
                  Publish Review
                </Button>
              )}
              {selectedReview.status !== 'HIDDEN' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleUpdateStatus(selectedReview, 'HIDDEN');
                    setIsViewModalOpen(false);
                  }}
                >
                  Hide Review
                </Button>
              )}
              {selectedReview.status !== 'FLAGGED' && (
                <Button
                  variant="warning"
                  onClick={() => {
                    handleUpdateStatus(selectedReview, 'FLAGGED');
                    setIsViewModalOpen(false);
                  }}
                >
                  Flag Review
                </Button>
              )}
              <Button
                variant="danger"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete Review
              </Button>
              <Button
                variant="light"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <p className="mb-4">
          Are you sure you want to delete this review from <strong>{selectedReview?.userName}</strong>? This action cannot be undone.
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
            onClick={handleDeleteReview}
            isLoading={isLoading}
          >
            Delete Review
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewManagement;