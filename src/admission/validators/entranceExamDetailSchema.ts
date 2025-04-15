import { z } from 'zod';

export const entranceExamDetailSchema = z.object({
  nameOfExamination : z.string().optional(),
  rollNumber : z.string().optional(),
  rank : z.number().optional(),
  qualified : z.boolean().optional()
});

export type IEntranceExamDetailSchema = z.infer<typeof entranceExamDetailSchema>;
