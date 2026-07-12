import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{7,}$/, 'Enter a valid phone number.');

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^[+\d][\d\s-]{7,}$/.test(value), {
    message: 'Enter a valid phone number.',
  });

export const bookingSchema = z
  .object({
    property: z.string().trim().min(1, 'Select a property.'),
    checkin: z.string().min(1, 'Select a check-in date.'),
    checkout: z.string().min(1, 'Select a check-out date.'),
    guests: z.string().min(1, 'Select guest count.'),
    guestName: z.string().trim().min(2, 'Enter the guest name.'),
    guestEmail: z.string().trim().email('Enter a valid email address.'),
    guestPhone: optionalPhoneSchema,
    specialRequests: z.string().trim().max(500, 'Special requests must be 500 characters or less.').optional(),
  })
  .refine((data) => new Date(data.checkout) > new Date(data.checkin), {
    message: 'Check-out must be after check-in.',
    path: ['checkout'],
  });

export const paymentSchema = z.object({
  cardholder: z.string().trim().min(2, 'Enter the cardholder name.'),
});

export const ownerSchema = z.object({
  ownerName: z.string().trim().min(2, 'Enter the owner name.'),
  ownerEmail: z.string().trim().email('Enter a valid email address.'),
  ownerPhone: phoneSchema,
  ownerAddress: z.string().trim().min(8, 'Enter the house address.'),
  unitCount: z.coerce.number().int().min(1, 'Units must be at least 1.').max(4, 'Units must be 4 or below.'),
  budget: z.string().trim().min(2, 'Enter the budget.'),
});

export const reviewSchema = z.object({
  evaluatorName: z.string().trim().min(2, 'Enter your name.'),
  evaluatorEmail: z.string().trim().email('Enter a valid email address.'),
  evaluatorPhone: phoneSchema,
  evaluatorAddress: z.string().trim().min(8, 'Enter the staycation address.'),
  unitCount: z.coerce.number().int().min(1, 'Units must be at least 1.').max(4, 'Units must be 4 or below.'),
  exclusivityAgreement: z.boolean().refine((value) => value, 'You must confirm exclusive partnership to continue.'),
});

export const loginSchema = z.object({
  mgmtEmail: z.string().trim().email('Enter a valid email address.'),
  mgmtPassword: z.string().min(6, 'Password must be at least 6 characters.'),
});

export function validateWithSchema(schema, values) {
  const parsed = schema.safeParse(values);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      errors: {},
    };
  }

  return {
    success: false,
    data: null,
    errors: parsed.error.flatten().fieldErrors,
  };
}

export function firstError(errors, field) {
  return errors[field]?.[0];
}
