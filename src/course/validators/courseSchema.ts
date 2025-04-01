import { z } from "zod";
import { Course } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const courseSchema = z.object({
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"),
    // DTODO: lets use string here[also create api to get courses]
    // Future DTODO: in enquire request body will change courseCode type string to _id
    courseCode: z.nativeEnum(Course),
    courseName : z.string().min(3, "Course Name is required"),
    collegeName: z.string().min(3).max(100, "College name should be between 3 and 100 characters"),
    totalSemesters : z.number().min(1, 'Please enter a valid value for total number of semesters')
});

export const courseRequestSchema = courseSchema.extend({
    departmentId : objectIdSchema       //This we are taking as course will be created inside department
})

// export const updateCourseSchema = courseSchema.omit({
//     courseCode: true,
//     academicYear: true
// }).extend({  id: objectIdSchema });


export const deleteCourseSchema = z.object({
    courseId : objectIdSchema,
    departmentId : objectIdSchema
})

export type ICourseSchema = z.infer<typeof courseSchema>;
export type ICourseRequestSchema = z.infer<typeof courseRequestSchema>;
export type ICourseDeleteSchema = z.infer<typeof deleteCourseSchema>;