import { z } from 'zod';

// DTODO: shift it to the common => As of now, common mai aur koi folders nahi hai so lets keep this one here as of now.
export const addressSchema = z.object({
  permanentAddress: z.string().min(5, 'Permanent address must be at least 5 characters'),
  district: z.string(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number starting with a non-zero digit'),
  state: z.string(),
  country: z.string()
});

export type IAddressSchema = z.infer<typeof addressSchema>;
