export interface SearchParams {
    origin?: string;
    destination?: string;
    departureDate?: Date;
    returnDate?: Date | null;
    passengers?: number;
  }
  
  export interface SearchResult {
    scheduleId: string;
    routeId: string;
    busId: string;
    operatorId: string;
    operatorName: string;
    origin: string;
    destination: string;
    departureTime: Date;
    arrivalTime: Date;
    duration: number;
    price: number;
    availableSeats: number;
    busName: string;
    amenities: string[];
    rating: number;
  }