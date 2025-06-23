import mongoose from 'mongoose';
import { z } from 'zod';
import { Countries, UserRoles } from '../config/constants';

export const objectIdSchema = z.custom<mongoose.Types.ObjectId>(
  (id) => {
    return mongoose.Types.ObjectId.isValid(id)
  },
  { message: "This is not a valid ObjectId" }
);

export const requestDateSchema = z
  .string()
  .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Date must be in DD/MM/YYYY format').optional();

export const contactNumberSchema = z
  .string().optional();
  // .regex(/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890').optional();


// DTODO: make emailSchema uniform
export const emailSchema = z
  .string()
  .email().optional();

export const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  district: z.string().optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number starting with a non-zero digit').optional(),
  state: z.string().optional(),
  country: z.nativeEnum(Countries).optional()
});

export type IAddressSchema = z.infer<typeof addressSchema>;

export const roleSchema = z.nativeEnum(UserRoles);

