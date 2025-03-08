import { z } from 'zod';

export const verifyOtpSchema = z.object({
  verifyOtp: z.number(),
  verifyOtpExpireAt: z.date(),
  email: z.string().email()
});

export type IVerifyOtp = z.infer<typeof verifyOtpSchema>;
