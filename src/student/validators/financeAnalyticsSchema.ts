import { z } from "zod";
import { CourseYears } from "../../config/constants";

export const courseYearDetailSchema = z.object({
    courseYear : z.nativeEnum(CourseYears),
    totalExpectedRevenue : z.number().nonnegative().default(0),
    totalCollection : z.number().nonnegative().default(0),
    totalStudents : z.number().nonnegative().default(0)
})

export const courseWiseSchema = z.object({
    courseCode : z.string(),
    departmentName : z.string(),
    details : z.array(courseYearDetailSchema),
    totalExpectedRevenue : z.number().nonnegative().default(0),
    totalCollection : z.number().nonnegative().default(0),
    totalStudents : z.number().nonnegative().default(0)
})

export const FinanceAnalyticsSchema = z.object({
    date : z.date(),
    academicYear : z.string(),
    totalExpectedRevenue : z.number().nonnegative().default(0),
    totalCollection : z.number().nonnegative().default(0),
    courseWise : z.array(courseWiseSchema),
    totalStudents : z.number().nonnegative().default(0)
})


export type IFinanceAnalyticsSchema = z.infer<typeof FinanceAnalyticsSchema>;
export type ICourseWiseSchema = z.infer<typeof courseWiseSchema>;
export type ICourseYearDetailSchema = z.infer<typeof courseYearDetailSchema>;