import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const semesterSchema = z.object({
    semesterNumber: z.number().min(1).max(10, "Semester number should be between 1 and 10"),
});

// export const semesterRequestSchema = semesterSchema.omit({
//     subjectDetails: true
// }).extend({
//     courseId: objectIdSchema
// });

// export const semesterUpdateSchema = semesterSchema.extend({
//     semesterId: objectIdSchema
// })

// export type ISemesterCreateSchema = z.infer<typeof semesterRequestSchema>;
// export type ISemesterUpdateSchema = z.infer<typeof semesterUpdateSchema>;
export type ISemesterSchema = z.infer<typeof semesterSchema>;
