import { z } from 'zod';

export const studentFilterSchema = z.object({
    course: z.string().optional(),
    semester: z.union([z.string(), z.number()]).optional()
});

export type IStudentFilter = z.infer<typeof studentFilterSchema>;
