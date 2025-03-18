import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { UserRoles } from '../config/constants';

export const objectIdSchema = z.custom<Types.ObjectId>(
  (id) => mongoose.Types.ObjectId.isValid(id),
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


export const roleSchema = z.nativeEnum(UserRoles);