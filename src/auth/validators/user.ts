import zod from 'zod';
export const userSchema = zod.object({
  id: zod.string(),
  email: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  roles: zod.array(zod.string())
});
