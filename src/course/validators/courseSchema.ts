import { z } from "zod";
import { semesterSchema } from "./semesterSchema";
import { Course } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const courseSchema = z.object({
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"),
    courseCode: z.nativeEnum(Course),
    department: z.string().min(3).max(50, "Department name should be between 3 and 50 characters"),
    collegeName: z.string().min(3).max(100, "College name should be between 3 and 100 characters"),
    hodName: z.string().min(3).max(100, "HOD name should be between 3 and 100 characters"),
    semester: z.array(semesterSchema).optional()
});

export const updateCourseSchema = courseSchema.omit({
    courseCode: true,
    academicYear: true
}).extend({  id: objectIdSchema });


export type ICourseSchema = z.infer<typeof courseSchema>;
