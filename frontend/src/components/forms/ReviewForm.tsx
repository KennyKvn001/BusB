// src/components/forms/ReviewForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define review form validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5, 'Maximum rating is 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(500, 'Comment cannot exceed 500 characters'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, onCancel }) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });
  
  const selectedRating = watch('rating');
  
  const handleStarClick = (rating: number) => {
    setValue('rating', rating, { shouldValidate: true });
  };
  
  const handleFormSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit(data.rating, data.comment);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rating descriptions
  const ratingDescriptions = [
    'Select a rating',
    'Poor - Did not meet expectations',
    'Fair - Below average experience',
    'Good - Average experience',
    'Very Good - Above average experience',
    'Excellent - Exceeded expectations'
  ];
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate your experience
        </label>
        <div className="flex items-center mb-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onMouseEnter={() => setHoveredStar(rating)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={() => handleStarClick(rating)}
              className="text-3xl focus:outline-none"
            >
              <span className={`${
                (hoveredStar !== null ? rating <= hoveredStar : rating <= selectedRating)
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}>
                ★
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {selectedRating ? ratingDescriptions[selectedRating] : ratingDescriptions[0]}
        </p>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
        )}
      </div>
      
      {/* Hidden input for rating */}
      <input
        type="hidden"
        {...register('rating', { valueAsNumber: true })}
      />
      
      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Your Review
        </label>
        <textarea
          id="comment"
          rows={4}
          {...register('comment')}
          className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.comment ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Tell us about your experience..."
        />
        <div className="flex justify-between items-center mt-1">
          <p className={`text-sm ${errors.comment ? 'text-red-600' : 'text-gray-500'}`}>
            {errors.comment ? errors.comment.message : `${watch('comment').length}/500 characters`}
          </p>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-md text-white ${
            isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;