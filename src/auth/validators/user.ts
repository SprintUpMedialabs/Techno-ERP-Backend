import { z } from 'zod';
import { UserRoles } from '../../config/constants';

export const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string().optional(),
  roles: z.array(z.nativeEnum(UserRoles)).default([UserRoles.BASIC_USER])
});

export type IUser = z.infer<typeof userSchema>;