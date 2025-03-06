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

// TODO: take a look to this we may can use this.
// export const handleZodError = (error: any) => {
//   if (error instanceof z.ZodError) {
//     throw new Error(error.errors.map(err => err.message).join(', '));
//   }
// }


