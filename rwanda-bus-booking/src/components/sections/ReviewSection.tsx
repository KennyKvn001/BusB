// src/components/sections/ReviewSection.tsx
import React, { useState, useEffect } from 'react';
import { Review } from '../../types/review';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

interface ReviewSectionProps {
  routeId?: string;
  operatorId?: string;
  showTitle?: boolean;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  routeId, 
  operatorId, 
  showTitle = true 
}) => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        let endpoint = '/reviews';
        let params = {};
        
        if (routeId) {
          endpoint = '/reviews/route';
          params = { routeId };
        } else if (operatorId) {
          endpoint = '/reviews/operator';
          params = { operatorId };
        }
        
        const { data } = await api.get(endpoint, { params });
        setReviews(data);
        
        // Calculate average rating
        if (data.length > 0) {
          const avg = data.reduce((sum: number, review: Review) => sum + review.rating, 0) / data.length;
          setAverageRating(avg);
          
          // Count ratings
          const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          data.forEach((review: Review) => {
            counts[review.rating as keyof typeof counts] += 1;
          });
          setRatingCounts(counts);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        showToast('Failed to load reviews', 'error');
        
        // Fallback mock data
        const mockReviews: Review[] = Array(5).fill(0).map((_, index) => ({
          id: `review-${index + 1}`,
          userId: `user-${index + 1}`,
          userName: `User ${index + 1}`,
          routeId: routeId || `route-${index + 1}`,
          operatorId: operatorId || `operator-${index + 1}`,
          bookingId: `booking-${index + 1}`,
          rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
          comment: [
            'Great service and comfortable bus. The driver was professional.',
            'On time departure and arrival. Clean bus with good AC.',
            'Enjoyed the trip. Would recommend this operator.',
            'The journey was smooth and the staff was friendly.',
            'Good value for money. Will travel again with them.'
          ][index],
          createdAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * index)),
        }));
        
        setReviews(mockReviews);
        
        // Calculate mock average rating
        if (mockReviews.length > 0) {
          const avg = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length;
          setAverageRating(avg);
          
          // Count mock ratings
          const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          mockReviews.forEach((review) => {
            counts[review.rating as keyof typeof counts] += 1;
          });
          setRatingCounts(counts);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [routeId, operatorId, showToast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No reviews available yet.</p>
      </div>
    );
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showTitle && (
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Customer Reviews
        </h2>
      )}
      
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xl">
                  {i + 1 <= Math.round(averageRating) ? '★' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star] || 0;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm text-gray-600">{star}</span>
                  <span className="ml-1 text-yellow-400">★</span>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                  <div
                    className="h-2 bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{review.userName}</span>
                  <span className="ml-2 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                    ))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <p className="mt-2 text-gray-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;