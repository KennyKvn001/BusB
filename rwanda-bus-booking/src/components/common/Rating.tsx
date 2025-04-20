export interface Review {
    id: string;
    userId: string;
    userName: string;
    routeId: string;
    operatorId: string;
    bookingId: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }