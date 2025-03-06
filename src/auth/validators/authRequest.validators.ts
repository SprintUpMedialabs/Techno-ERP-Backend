import { z } from 'zod';
import { UserRoles } from '../../config/constants';

export const registerationRequestSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    roles: z.array(z.nativeEnum(UserRoles)).default([UserRoles.BASIC_USER]),
    token: z.string()
});

export type IRegisterationRequest = z.infer<typeof registerationRequestSchema>;


export const OTPRequestSchema = z.object({
    email: z.string().email(),
    otp: z.number().min(100000).max(999999)
});

export type IOTPRequest = z.infer<typeof OTPRequestSchema>;

export const loginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(100000).max(999999)
});

export type ILoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
    email: z.string().email(),
});

export type IForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const updatePasswordRequestSchema = z.object({
    password: z.string().min(100000).max(999999)
});

export type IUpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;