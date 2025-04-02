import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const subjectDetailsSchema = z.object({
    subjectName: z.string().min(3).max(100, "Subject name should be between 3 to 100 characters"),
    instructor: objectIdSchema,
    subjectCode: z.string().min(3).max(10, "Subject code should be between 3 to 10 characters"),
});

export const subjectDetailsRequestSchema = subjectDetailsSchema.extend({
    semesterId : objectIdSchema
});

export const subjectDetailsUpdateSchema = subjectDetailsSchema.extend({
    subjectId : objectIdSchema
})

export type ISubjectDetailsSchema = z.infer<typeof subjectDetailsSchema>;
export type ISubjectDetailsRequestSchema = z.infer<typeof subjectDetailsRequestSchema>;
export type ISubjectDetailsUpdateSchema = z.infer<typeof subjectDetailsUpdateSchema>;