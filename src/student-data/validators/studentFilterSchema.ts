import { z } from 'zod';
import { Course } from '../../config/constants';

export const studentFilterSchema = z.object({
    course: z.nativeEnum(Course).optional(),
    semester: z.union([z.string(), z.number()]).optional()
});

export type IStudentFilter = z.infer<typeof studentFilterSchema>;
