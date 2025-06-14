import { z } from 'zod';
import { EducationLevel } from '../../config/constants';

export const academicDetailSchema = z.object({
  educationLevel: z.nativeEnum(EducationLevel), // Only allows fixed values
  schoolCollegeName: z.string().optional(),
  universityBoardName: z.string().optional(),
  passingYear: z
    .number()
    .int()
    .refine((year) => year.toString().length === 4, {
      message: 'Passing Year must be a valid 4-digit year'
    }).optional(),
  percentageObtained: z
    .number()
    .optional(),
  subjects: z.string().optional(),
});
// Array schema
export const academicDetailsArraySchema = z.array(academicDetailSchema);

export type IAcademicDetailSchema = z.infer<typeof academicDetailSchema>;
