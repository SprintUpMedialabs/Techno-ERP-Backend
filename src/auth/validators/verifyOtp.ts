import { z } from 'zod';

export const verifyOtpSchema = z.object({
  verifyOtp: z.number(),
  verifyOtpExpireAt: z.date()
});

export type IVerifyOtp = z.infer<typeof verifyOtpSchema>;
