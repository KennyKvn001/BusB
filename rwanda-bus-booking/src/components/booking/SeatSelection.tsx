// src/components/booking/SeatSelection.tsx
import React from 'react';

interface SeatSelectionProps {
  busCapacity: number;
  bookedSeats: number[];
  selectedSeats: number[];
  onChange: (selectedSeats: number[]) => void;
  maxSeats?: number;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({
  busCapacity,
  bookedSeats,
  selectedSeats,
  onChange,
  maxSeats = 10,
}) => {
  // Define columns for the seat layout
  const columns = 4; // Standard bus layout: 2 seats on each side of the aisle

  // Toggle seat selection
  const toggleSeat = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) {
      return; // Seat is already booked, can't select
    }

    if (selectedSeats.includes(seatNumber)) {
      // Deselect the seat
      onChange(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      // Select the seat if we haven't reached the maximum
      if (selectedSeats.length < maxSeats) {
        onChange([...selectedSeats, seatNumber]);
      }
    }
  };

  // Get seat status class
  const getSeatStatusClass = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) {
      return 'bg-gray-300 cursor-not-allowed text-gray-500';
    }
    if (selectedSeats.includes(seatNumber)) {
      return 'bg-blue-600 text-white';
    }
    return 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700';
  };

  return (
    <div className="bg-gray-100 p-4 rounded-md">
      {/* Bus front */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-12 bg-gray-300 rounded-t-lg flex items-center justify-center text-gray-700 font-medium">
          FRONT
        </div>
      </div>

      {/* Seats layout */}
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {Array.from({ length: busCapacity }, (_, i) => i + 1).map(seatNumber => {
            // Calculate column index to determine seat position
            const colIndex = (seatNumber - 1) % columns;

            // Add aisle space between seats 2 and 3 in each row
            const marginClass = colIndex === 2 ? 'ml-4' : '';

            return (
              <div key={seatNumber} className={`flex justify-center ${marginClass}`}>
                <button
                  type="button"
                  disabled={bookedSeats.includes(seatNumber)}
                  onClick={() => toggleSeat(seatNumber)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${getSeatStatusClass(seatNumber)}`}
                  title={`Seat ${seatNumber}`}
                >
                  {seatNumber}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm mr-1"></div>
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded-sm mr-1"></div>
          <span className="text-xs text-gray-600">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-300 rounded-sm mr-1"></div>
          <span className="text-xs text-gray-600">Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
