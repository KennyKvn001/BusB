export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
  }

  export interface Booking {
    id: string;
    bookingNumber: string;
    userId?: string;
    passengerName: string;
    contactEmail?: string;
    contactPhone?: string;
    scheduleId: string;
    route: {
      origin: string;
      destination: string;
    };
    bus: {
      id: string;
      name: string;
      licensePlate: string;
      operatorName: string;
    };
    departureDate: Date;
    departureTime: Date;
    arrivalTime: Date;
    seatNumbers: number[];
    totalAmount: number;
    status: BookingStatus;
    paymentMethod: 'mobile_money' | 'credit_card' | 'pay_later';
    paymentStatus: 'PAID' | 'UNPAID';
    createdAt: Date;
  }