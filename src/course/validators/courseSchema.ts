import { z } from "zod";
import { semesterSchema } from "./semesterSchema"; 
import { objectIdSchema } from "../../validators/commonSchema";

export const courseSchema = z.object({
  courseName: z.string({ required_error: "Course Name is required" }).nonempty("Course Name is required."),
  courseCode: z.string({ required_error: "Course Code is required" }).nonempty("Course Code is required."),
  courseFullName: z.string({ required_error: "Course Full Name is required" }).nonempty("Course Full Name is required."),
  collegeName: z.string({ required_error: "College Name is required" }).nonempty("College Name is required."),
  departmentMetaDataId : objectIdSchema,
  startingYear: z.number()
    .min(1000, "Starting year must be a 4-digit year")
    .max(9999, "Starting year must be a 4-digit year"),
  totalSemesters : z.number(),
  semester: z.array(semesterSchema).optional(), 
});

export const courseUpdateSchema = courseSchema.extend({
  courseId : objectIdSchema
}).omit({ startingYear : true, totalSemesters : true, semester : true});


export type ICourseSchema = z.infer<typeof courseSchema>;
export type ICourseUpdateSchema = z.infer<typeof courseUpdateSchema>;