import { z } from 'zod';
import { EducationLevel } from '../../config/constants';

export const academicDetailSchema = z.object({
  educationLevel : z.nativeEnum(EducationLevel), // Only allows fixed values
  schoolCollegeName: z.string().min(1, 'School/College Name is required'),
  universityBoardName: z.string().min(1, 'University/Board Name is required'),
  passingYear: z
    .number()
    .int()
    .refine((year) => year.toString().length === 4, {
      message: 'Passing Year must be a valid 4-digit year'
    }),
  percentageObtained: z
    .number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
  subjects: z
    .array(z.string().min(1, 'Subject name is required'))
    .nonempty('Subjects cannot be empty')
});
// Array schema
export const academicDetailsArraySchema = z.array(academicDetailSchema);

export type IAcademicDetailSchema = z.infer<typeof academicDetailSchema>;
