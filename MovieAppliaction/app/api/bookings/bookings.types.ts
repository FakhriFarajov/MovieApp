export interface BookingRequest {
  showTimeId: string;
  movieId: string;
  seatIds: string[];
  paymentMethod: string;
}

export interface Ticket {
  ticketId: string;
  seatId: string;
  label: string;
  price: number;
  qrCode: string;
}

// Response from createBooking - same structure as Booking
export interface BookingResponse {
  id: string;
  showTimeId: string;
  clientId: string;
  totalPrice: number;
  status: string;
  tickets: Ticket[];
}

export interface Booking {
  id: string;
  showTimeId: string;
  clientId: string;
  totalPrice: number;
  status: string;
  tickets: Ticket[];
}

// Enriched booking with movie details
export interface EnrichedBooking extends Booking {
  movieId?: string;
  movieTitle?: string;
  posterPath?: string;
  startTime?: string;
}
