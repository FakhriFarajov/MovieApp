import { authHttp } from '../HttpClient';
import { Booking, BookingRequest, BookingResponse } from './bookings.types';

export const createBooking = async (booking: BookingRequest): Promise<BookingResponse> => {
  const res = await authHttp.post('/Bookings/book', booking);
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Failed to create booking: ${res.statusText}`);
  }
  console.log('Created booking no data:', res);
  console.log('Created booking data:', res.data);
  return res.data as BookingResponse;
};

export const getBookings = async (): Promise<Booking[]> => {
  const res = await authHttp.get('/Bookings/getBooking');
  if (res.status !== 200) throw new Error(`Failed to get bookings: ${res.statusText}`);
  console.log('Fetched bookings with no data:', res);
  console.log('Fetched bookings with data:', res.data);

  // API returns array directly
  return res.data as Booking[];
};
