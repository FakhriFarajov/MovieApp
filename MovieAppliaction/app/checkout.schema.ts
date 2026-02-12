import { z } from 'zod';

// Booking request schema matching the API
export const bookingRequestSchema = z.object({
  showTimeId: z.string().min(1, 'Show time is required'),
  movieId: z.string().min(1, 'Movie is required'),
  seatIds: z.array(z.string()).min(1, 'At least one seat is required'),
  paymentMethod: z.enum(['card', 'mobile', 'bank'], {
    message: 'Payment method is required',
  }),
});

// Card payment details schema
export const cardPaymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .transform((val) => val.replace(/\s/g, ''))
    .refine((val) => val.length === 16, 'Card number must be 16 digits')
    .refine((val) => /^\d+$/.test(val), 'Card number must contain only digits'),
  cardName: z
    .string()
    .min(1, 'Cardholder name is required')
    .min(2, 'Name must be at least 2 characters'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^\d{2}\/\d{2}$/, 'Expiry date must be in MM/YY format')
    .refine((val) => {
      const [month, year] = val.split('/').map(Number);
      if (month < 1 || month > 12) return false;
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }, 'Card has expired or invalid date'),
  cvv: z
    .string()
    .min(3, 'CVV must be at least 3 digits')
    .max(4, 'CVV must be at most 4 digits')
    .regex(/^\d+$/, 'CVV must contain only digits'),
});

// Mobile payment schema

// Types
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type CardPaymentDetails = z.infer<typeof cardPaymentSchema>;
