import { z } from 'zod';

export const previousCollegeDataSchema = z.object({
  collegeName: z.string().min(3, 'College Name must be at least 3 characters').optional(),
  district: z.string().optional(),
  boardUniversity: z.string().optional(),
  passingYear: z
    .number()
    .int()
    .refine((year) => year.toString().length === 4, {
      message: 'Passing Year must be a valid 4-digit year'
    }),
  aggregatePercentage: z
    .number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100')
});

export type IPreviousCollegeDataSchema = z.infer<typeof previousCollegeDataSchema>;
