import { z } from "zod";
import { semesterSchema } from "./semesterSchema";
import { Course } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const courseSchema = z.object({
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"),
    courseCode: z.nativeEnum(Course),
    // DTODO: departmnt should enum | need to provide
    department: z.string().min(3).max(50, "Department name should be between 3 and 50 characters"),
    // DTODO: clg name should be enum
    collegeName: z.string().min(3).max(100, "College name should be between 3 and 100 characters"),
    // DTODO: eventually this will be from dropdown
    hodName: z.string().min(3).max(100, "HOD name should be between 3 and 100 characters"),
    semester: z.array(semesterSchema).optional()
});

// DTODO: let's create seperate request schema
// add this totalSemster: z.number().optional(),

// DTODO: extend requestSchema
export const updateCourseSchema = courseSchema.omit({
    courseCode: true,
    academicYear: true,
    semester:true
}).extend({  id: objectIdSchema });


export type ICourseSchema = z.infer<typeof courseSchema>;
