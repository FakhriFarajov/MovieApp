import SecureStore from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type SeatType = 'Adult' | 'Child' | 'Family' | string;

export interface Seat {
  row: number;
  column: number;
  isBooked: boolean;
  // associated movie id for this booking
  movieId?: string;
  // who booked this seat (user id or email)
  bookingUserId?: string;
  bookingUserEmail?: string;
  // type of ticket for this seat
  seatType?: SeatType;
  // optional booking id to group multiple seats under a single booking
  bookingId?: string;
}

interface SeatsState {
  seats: Seat[];
  // book a single seat (will create seat entry if not present)
  bookSeat: (
    coord: { row: number; column: number },
    bookingUserId?: string,
    options?: { bookingUserEmail?: string; seatType?: SeatType; bookingId?: string; movieId?: string }
  ) => Promise<void>;
  // delete/release a single seat booking by coord
  deleteSeat: (coord: { row: number; column: number }) => Promise<void>;
  // reset all seats
  resetSeats: () => Promise<void>;
}

const SEATS_KEY = 'seats_v1';

const useSeatsStore = create<SeatsState>((set, get) => {
  // hydrate from SecureStore
  (async () => {
    try {
      const raw = await SecureStore.getItem(SEATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Seat[];
        set({ seats: parsed });
      }
    } catch (e) {
      console.warn('Failed to hydrate seats from SecureStore', e);
    }
  })();

  const persist = async (seats: Seat[]) => {
    try {
      await SecureStore.setItem(SEATS_KEY, JSON.stringify(seats));
    } catch (e) {
      console.warn('Failed to persist seats', e);
    }
  };

  return {
    seats: [],

    bookSeat: async (coord, bookingUserId, options = {}) => {
      set((state) => {
        const idx = state.seats.findIndex((s) => s.row === coord.row && s.column === coord.column && s.movieId === options.movieId);
        if (idx >= 0) {
          const seats = state.seats.slice();
          seats[idx] = {
            ...seats[idx],
            isBooked: true,
            bookingUserId: bookingUserId ?? seats[idx].bookingUserId,
            bookingUserEmail: options.bookingUserEmail ?? seats[idx].bookingUserEmail,
            seatType: options.seatType ?? seats[idx].seatType,
            bookingId: options.bookingId ?? seats[idx].bookingId,
            movieId: options.movieId ?? seats[idx].movieId,
          } as Seat;
          // persist async (fire-and-forget)
          persist(seats);
          return { seats };
        }
        const seats = [
          ...state.seats,
          {
            row: coord.row,
            column: coord.column,
            isBooked: true,
            bookingUserId: bookingUserId ?? undefined,
            bookingUserEmail: options.bookingUserEmail ?? undefined,
            seatType: options.seatType ?? 'Adult',
            bookingId: options.bookingId ?? undefined,
            movieId: options.movieId ?? undefined,
          } as Seat,
        ];
        persist(seats);
        return { seats };
      });
    },

    deleteSeat: async (coord) => {
      set((state) => {
        const seats = state.seats.map((s) => {
          if (s.row === coord.row && s.column === coord.column) {
            return { ...s, isBooked: false, bookingUserId: undefined, bookingUserEmail: undefined, seatType: undefined, bookingId: undefined } as Seat;
          }
          return s;
        });
        persist(seats);
        return { seats };
      });
    },

    resetSeats: async () => {
      set({ seats: [] });
      try {
        await SecureStore.removeItem(SEATS_KEY);
      } catch (e) {
        console.warn('Failed to clear seats from SecureStore', e);
      }
    },
  };
});

export default useSeatsStore;