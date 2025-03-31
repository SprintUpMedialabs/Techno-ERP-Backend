import mongoose from 'mongoose';
import { z } from 'zod';
import { Countries, Districts, StatesOfIndia, UserRoles } from '../config/constants';

export const objectIdSchema = z.custom<mongoose.Types.ObjectId>(
  (id) => {
    return mongoose.Types.ObjectId.isValid(id)
  },
  { message: "Invalid ObjectId" }
);

export const requestDateSchema = z
  .string()
  .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Date must be in DD/MM/YYYY format');

export const contactNumberSchema = z
  .string()
  .regex(/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890');


// DTODO: make emailSchema uniform
export const emailSchema = z
  .string()
  .email();

export const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Permanent address must be at least 5 characters'),
  addressLine2: z.string().min(5, 'Permanent address must be at least 5 characters'),  
  district: z.nativeEnum(Districts),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number starting with a non-zero digit'),
  state: z.nativeEnum(StatesOfIndia),
  country: z.nativeEnum(Countries)
});

export type IAddressSchema = z.infer<typeof addressSchema>;

export const roleSchema = z.nativeEnum(UserRoles);

