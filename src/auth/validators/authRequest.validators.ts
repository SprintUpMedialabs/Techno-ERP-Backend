import { z } from 'zod';
import { UserRoles } from '../../config/constants';

export const registerationRequestSchema = z.object({
  firstName: z.string().regex(/^[A-Za-z]+$/, { message: 'First name must contain only alphabets' }),
  lastName: z.string().regex(/^[A-Za-z]+$/, { message: 'Last name must contain only alphabets' }),
  roles: z
    .array(z.nativeEnum(UserRoles), { message: 'Invalid role specified' })
    .default([UserRoles.BASIC_USER]),
  token: z.string({ message: 'Token is required' })
});

export type IRegisterationRequest = z.infer<typeof registerationRequestSchema>;

export const OTPRequestSchema = z.object({
  email: z.string().email(),
  otp: z.number().min(100000).max(999999)
});

export type IOTPRequest = z.infer<typeof OTPRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' }),

  password: z.string({ message: 'Password is required' })
});

export type ILoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' })
});

export type IForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const updatePasswordRequestSchema = z.object({
  password: z.string({ message: 'Password is required' })
});

export type IUpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;

export const emailSchema = z.object({
  email: z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' })
});

export type IEmail = z.infer<typeof emailSchema>;
