import { z } from 'zod';

export const noPlaceholder = (val: string): boolean => !val.includes('[PLACEHOLDER');

export const LocalCitationsSchema = z.object({
  business_name: z
    .string()
    .min(1, 'business_name must not be empty')
    .refine(noPlaceholder, { message: 'Placeholder detected — replace with a real value before deploying.' }),
  address: z
    .string()
    .min(1, 'address must not be empty')
    .refine(noPlaceholder, { message: 'Placeholder detected — replace with a real value before deploying.' }),
  zip: z
    .string()
    .min(1, 'zip must not be empty')
    .refine(noPlaceholder, { message: 'Placeholder detected — replace with a real value before deploying.' }),
  phone: z
    .string()
    .min(1, 'phone must not be empty')
    .refine(noPlaceholder, { message: 'Placeholder detected — replace with a real value before deploying.' }),
});
