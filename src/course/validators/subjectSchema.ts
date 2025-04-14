import { z } from "zod";
import { scheduleSchema } from "./scheduleSchema";
import { objectIdSchema } from "../../validators/commonSchema";

export const subjectSchema = z.object({
    subjectName: z.string({ required_error: "Subject Name is required. "}).nonempty("Subject Name is required."),
    subjectCode: z.string({ required_error : "Subject Code is required. "}).nonempty("Subject Code is required."),
    instructor: z.array(objectIdSchema),
    schedule: scheduleSchema
});


export const createSubjectSchema = subjectSchema.extend({
    courseId : objectIdSchema,
    semesterId : objectIdSchema
}).omit({ schedule : true });


export type ISubjectSchema = z.infer<typeof subjectSchema>;
export type ICreateSubjectSchema = z.infer<typeof createSubjectSchema>;