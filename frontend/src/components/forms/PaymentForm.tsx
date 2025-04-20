// src/components/forms/PaymentForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';

// Define payment method types
type PaymentMethod = 'mobile_money' | 'credit_card' | 'pay_later';

// Define validation schemas for different payment methods
const mobileMoneySchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  provider: z.enum(['mtn', 'airtel']),
});

const creditCardSchema = z.object({
  cardNumber: z.string().min(16, 'Card number must be at least 16 digits'),
  cardholderName: z.string().min(3, 'Cardholder name is required'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format'),
  cvv: z.string().min(3, 'CVV must be at least 3 digits'),
});

const payLaterSchema = z.object({
  agreeToPayLater: z.boolean().refine(val => val === true, {
    message: 'You must agree to pay at the bus station',
  }),
});

// Define props interface
interface PaymentFormProps {
  paymentMethod: PaymentMethod;
  amount: number;
  onPaymentComplete: (paymentData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  amount,
  onPaymentComplete,
  onCancel,
  isLoading = false,
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Determine which schema to use based on payment method
  const schema = paymentMethod === 'mobile_money'
    ? mobileMoneySchema
    : paymentMethod === 'credit_card'
      ? creditCardSchema
      : payLaterSchema;
  
  // Set up form with the appropriate schema
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });
  
  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setPaymentStatus('processing');
      setErrorMessage(null);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      setPaymentStatus('success');
      
      // Call the onPaymentComplete callback with the payment data
      onPaymentComplete({
        method: paymentMethod,
        amount,
        status: 'PAID',
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage('Payment processing failed. Please try again.');
    }
  };
  
  // Render different form based on payment method
  const renderPaymentMethodForm = () => {
    switch (paymentMethod) {
      case 'mobile_money':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Money Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="mtn"
                    {...register('provider')}
                    className="mr-2"
                  />
                  <span>MTN Mobile Money</span>
                </label>
                <label className="flex p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="airtel"
                    {...register('provider')}
                    className="mr-2"
                  />
                  <span>Airtel Money</span>
                </label>
              </div>
              {errors.provider && (
                <p className="mt-1 text-sm text-red-600">{errors.provider.message as string}</p>
              )}
            </div>
            
            <Input
              label="Phone Number"
              placeholder="e.g. 078XXXXXXX"
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
            />
            
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-800">
                You will receive a prompt on your phone to confirm the payment of {amount.toLocaleString()} RWF.
              </p>
            </div>
          </div>
        );
        
      case 'credit_card':
        return (
          <div className="space-y-4">
            <Input
              label="Card Number"
              placeholder="XXXX XXXX XXXX XXXX"
              {...register('cardNumber')}
              error={errors.cardNumber?.message}
            />
            
            <Input
              label="Cardholder Name"
              placeholder="Name as it appears on card"
              {...register('cardholderName')}
              error={errors.cardholderName?.message}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                {...register('expiryDate')}
                error={errors.expiryDate?.message}
              />
              
              <Input
                label="CVV"
                placeholder="XXX"
                type="password"
                {...register('cvv')}
                error={errors.cvv?.message}
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                Your card will be charged {amount.toLocaleString()} RWF.
              </p>
            </div>
          </div>
        );
        
      case 'pay_later':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Pay at Bus Station</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have chosen to pay at the bus station. Please note:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Your booking will be held for 24 hours</li>
                <li>You must arrive at least 30 minutes before departure</li>
                <li>Payment must be made in cash or mobile money</li>
                <li>Bring your booking reference and ID</li>
              </ul>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToPayLater"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  {...register('agreeToPayLater')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToPayLater" className="font-medium text-gray-700">
                  I agree to pay {amount.toLocaleString()} RWF at the bus station
                </label>
                <p className="text-gray-500">
                  I understand that my booking will be cancelled if I don't pay on time.
                </p>
                {errors.agreeToPayLater && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToPayLater.message as string}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {paymentMethod === 'mobile_money'
          ? 'Mobile Money Payment'
          : paymentMethod === 'credit_card'
            ? 'Credit Card Payment'
            : 'Pay at Bus Station'}
      </h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
          <span className="text-gray-700">Total Amount:</span>
          <span className="text-xl font-bold text-gray-900">{amount.toLocaleString()} RWF</span>
        </div>
      </div>
      
      {paymentStatus === 'error' && (
        <Alert
          status="error"
          title="Payment Failed"
          description={errorMessage || 'There was an error processing your payment. Please try again.'}
          className="mb-4"
        />
      )}
      
      {paymentStatus === 'success' ? (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Payment Successful</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your payment has been processed successfully. You will receive a confirmation shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderPaymentMethodForm()}
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="light"
              onClick={onCancel}
              disabled={isLoading || paymentStatus === 'processing'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading || paymentStatus === 'processing'}
            >
              {paymentMethod === 'pay_later' ? 'Confirm Booking' : 'Complete Payment'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;
