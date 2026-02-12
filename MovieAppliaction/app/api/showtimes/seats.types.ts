export interface Seat {
  seatId: string;
  rowNumber: number;
  columnNumber: number;
  label: string;
  isTaken: boolean;
  ticketId: string | null;
  ticketStatus: string | null;
}

export type SeatsResponse = Seat[];
