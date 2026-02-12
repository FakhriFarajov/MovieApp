import { authHttp } from '../HttpClient';
import { SeatsResponse } from './seats.types';

/**
 * Fetch all seats for a specific showtime
 * GET /api/ShowTimes/{showTimeId}/seats
 */
export async function fetchSeatsByShowTime(showTimeId: string): Promise<SeatsResponse> {
  const response = await authHttp.get<SeatsResponse>(`/ShowTimes/${showTimeId}/seats`);
  return response.data;
}
