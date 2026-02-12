import { authHttp } from '../HttpClient';
import { ShowTimesResponse } from './showtimes.types';

export async function fetchShowTimesByMovie(movieId: string): Promise<ShowTimesResponse> {
  const response = await authHttp.get(`/ShowTimes/movie/${encodeURIComponent(movieId)}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch showtimes: ${response.statusText}`);
  }
  console.log('Fetched showtimes:', response.data);
  return response.data as ShowTimesResponse;
}

export async function fetchShowTimeById(showTimeId: string): Promise<ShowTimesResponse[0]> {
  const response = await authHttp.get(`/ShowTimes/${encodeURIComponent(showTimeId)}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch showtime: ${response.statusText}`);
  }
  return response.data;
}
