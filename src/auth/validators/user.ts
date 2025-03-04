import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().optional(),
  roles: z.array(z.string())
});

export type IUser = z.infer<typeof userSchema>;
