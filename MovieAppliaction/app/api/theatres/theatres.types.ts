export interface TheatreHall {
  id: string;
  name: string;
  rows: number;
  columns: number;
  // allow extra backend props
  [key: string]: any;
}

export interface Theatre {
  id: string;
  name: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  halls?: TheatreHall[];
  // allow extra backend props
  [key: string]: any;
}

export type TheatresResponse = Theatre[];
