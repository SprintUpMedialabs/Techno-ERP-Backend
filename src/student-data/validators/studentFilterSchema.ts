import { z } from 'zod';

export const studentFilterSchema = z.object({
    course: z.string().optional(),
    semester: z.number().min(1, 'Invalid Semester').max(12, 'Invalid Semester').optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid Academic Year').optional(),
    search: z.string().optional()
});

export type IStudentFilter = z.infer<typeof studentFilterSchema>;
