export interface Route {
    id: string;
    origin: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
    popular: boolean;
    price: number;
    operatorId: string;
    operatorName: string;
  }

  export interface BusSchedule {
    id: string;
    routeId: string;
    busId: string;
    departureTime: Date;
    arrivalTime: Date;
    availableSeats: number;
    price: number;
  }
  