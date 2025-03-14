import mongoose from 'mongoose';
import { z } from 'zod';

export const objectIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
  message: 'Invalid ObjectId'
});

export const requestDateSchema = z.string().regex(
  /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
  "Date must be in DD/MM/YYYY format"
);

export const contactNumberSchema = z
  .string()
  .regex(/^\d{10}$/, 'Invalid contact number format. Expected: 1234567890');