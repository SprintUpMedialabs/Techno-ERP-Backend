import { z } from "zod";
import { scheduleSchema } from "./scheduleSchema";
import { objectIdSchema } from "../../validators/commonSchema";

export const subjectDetailsSchema = z.object({
    subjectName: z.string().min(3).max(100, "Subject name should be between 3 to 100 characters"),
    instructorName: z.string().min(3).max(100, "Instructor name should be between 3 to 100 characters"),
    subjectCode: z.string().min(3).max(10, "Subject code should be between 3 to 10 characters"),
    schedule: z.array(scheduleSchema).optional()
});

export const subjectDetailsRequestSchema = subjectDetailsSchema.omit({
    schedule: true
}).extend({
    semesterId: objectIdSchema
});

export const subjectDetailsUpdateSchema = subjectDetailsRequestSchema.extend({
    subjectId: objectIdSchema
});

export type ISubjectDetailsSchema = z.infer<typeof subjectDetailsSchema>;
export type ISubjectDetailsRequestSchema = z.infer<typeof subjectDetailsUpdateSchema>;
export type ISubjectDetailsUpdateSchema = z.infer<typeof subjectDetailsUpdateSchema>;