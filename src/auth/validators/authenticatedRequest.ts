import { z } from 'zod';
import { UserRoles } from '../../config/constants';
import { Request } from 'express';

export const UserPayloadSchema = z.object({
  id: z.string(),
  roles: z.array(z.nativeEnum(UserRoles))
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;

export type AuthenticatedRequest = Request & {
  data?: UserPayload;
};
