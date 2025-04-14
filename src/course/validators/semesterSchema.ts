import { z } from "zod";
import { subjectSchema } from "./subjectSchema";

export const semesterSchema = z.object({
    semesterNumber: z.number().nonnegative("Semester Number should be a valid non negative integer"),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in the format YYYY-YYYY"),
    subjects: z.array(subjectSchema),
});

export type ISemesterSchema = z.infer<typeof semesterSchema>;