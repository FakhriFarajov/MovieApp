import { z } from 'zod';


export const profileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  surname: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
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
