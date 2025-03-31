import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const subjectDetailsSchema = z.object({
    subjectName: z.string().min(3).max(100, "Subject name should be between 3 to 100 characters"),
    instructorName: z.string().min(3).max(100, "Instructor name should be between 3 to 100 characters"),
    subjectCode: z.string().min(3).max(10, "Subject code should be between 3 to 10 characters"),
});

export const subjectDetailsRequestSchema = subjectDetailsSchema.extend({
    semesterId : objectIdSchema
});

export const subjectDetailsUpdateSchema = subjectDetailsSchema.extend({
    subjectId : objectIdSchema
}).omit({ subjectCode : true});

export type ISubjectDetailsSchema = z.infer<typeof subjectDetailsSchema>;
export type ISubjectDetailsRequestSchema = z.infer<typeof subjectDetailsRequestSchema>;
export type ISubjectDetailsUpdateSchema = z.infer<typeof subjectDetailsUpdateSchema>;