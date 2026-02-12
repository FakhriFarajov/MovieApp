import { z } from 'zod';


export const profileSchema = z.object({
  name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  surname: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^\+?[0-9\s\-()]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  profileImage: z.string().url().optional().or(z.literal('')).nullable(),
});

export const billingSchema = z.object({
  cardName: z.string().min(1, 'Name on card is required').max(100),
  cardNumber: z
    .string()
    .min(12, 'Card number looks too short')
    .max(23, 'Card number looks too long')
    .regex(/^[0-9 ]+$/, 'Card number must contain only digits and spaces'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/(?:\d{2})$/, 'Expiry must be in MM/YY format'),
  cvv: z.string().min(3).max(4).regex(/^[0-9]{3,4}$/, 'CVV must be 3 or 4 digits'),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type BillingValues = z.infer<typeof billingSchema>;

export default {
  profileSchema,
  billingSchema,
};
