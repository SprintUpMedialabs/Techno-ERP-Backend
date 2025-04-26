import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { CourseYears, FeeStatus } from "../../config/constants";
import { FeeSchema } from "./feeSchema";

export const baseExamSchema = z.object({
    type : z.string(),
    marks : z.number()
})

export const ExamsSchema = z.object({
    theory : baseExamSchema,
    practical : baseExamSchema,
    totalMarks : z.number()
});

export const baseAttendanceSchema = z.object({
    id : objectIdSchema,
    attended : z.boolean()
});

export const AttendanceSchema = z.object({
    lecturePlan : z.array(baseAttendanceSchema),
    practicalPlan : z.array(baseAttendanceSchema),
    totalLectureAttendance : z.number().default(0),
    totalPracticalAttendance : z.number().default(0)
})

export const SubjectSchema = z.object({
    subjectId : objectIdSchema,
    attendance : z.array(AttendanceSchema),
    exams : z.array(ExamsSchema)
})

export const SemesterSchema = z.object({
    semesterId : objectIdSchema,
    semesterNumber : z.number({ required_error : "Semester Number is required"}).nonnegative("Semester number must be greater than 0"),
    //DACHECK : Here we need to confirm, should academic year be of form 2024-25 or 2024-2025
    academicYear : z.string(),
    courseYear : z.nativeEnum(CourseYears),
    subjects : z.array(SubjectSchema),
    fees : FeeSchema
})

export const StudentSchema = z.object({
    courseId : objectIdSchema,
    courseName : z.string({required_error : "Course Name is required."}).nonempty("Course Name is required"),
    totalSemester : z.number({ required_error : "Total Number of Semesters is Required."}).nonnegative("Total number of semesters must be non-negative"),
    semester : z.array(SemesterSchema),
    feeStatus : z.nativeEnum(FeeStatus),
    extraBalance : z.number().default(0),
    transactionHistory : objectIdSchema
})


export type IStudentSchema = z.infer<typeof StudentSchema>;