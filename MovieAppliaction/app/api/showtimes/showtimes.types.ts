export interface ShowTime {
  id: string;
  movieId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
}

export type ShowTimesResponse = ShowTime[];
