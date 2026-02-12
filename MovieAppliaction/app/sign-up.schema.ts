import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .regex(/^[\p{L}\s'\-]+$/u, "Name may contain only letters, spaces, hyphens or apostrophes"),
    surname: z
      .string()
      .min(1, "Surname is required")
      .regex(/^[\p{L}\s'\-]+$/u, "Surname may contain only letters, spaces, hyphens or apostrophes"),
    email: z.string().min(1, "Email is required").email("Email must be a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one digit")
      .regex(/(?=.*[@$!%*?&_\-])/, "Password must contain at least one special character (e.g. @ $ ! % * ? & _ -)"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone is required")
      .regex(/^\+994\s\d{2}\s\d{3}\s\d{2}\s\d{2}$/, {
        message: "Phone must follow the format: +994 55 555 55 55",
      }),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((v) => {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        // ensure not in future (compare dates only)
        const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (dateOnly > todayOnly) return false;
        // age >= 13
        let age = todayOnly.getFullYear() - dateOnly.getFullYear();
        if (dateOnly > new Date(todayOnly.getFullYear() - age, todayOnly.getMonth(), todayOnly.getDate())) age--;
        return age >= 13;
      }, { message: "Invalid date or you must be at least 13 years old" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignUpSchemaType = z.infer<typeof signUpSchema>;

