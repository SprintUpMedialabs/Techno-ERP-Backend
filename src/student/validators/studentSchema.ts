import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { CourseYears, FeeStatuses } from "../../config/constants";
import { FeeSchema } from "./feeSchema";

export const BaseExamSchema = z.object({
    type: z.string().optional(),
    marks: z.number().optional()
})

export const ExamsSchema = z.object({
    theory: z.array(BaseExamSchema).optional(),
    practical: z.array(BaseExamSchema).optional(),
    totalMarks: z.number().default(0).optional()
});

export const baseAttendanceSchema = z.object({
    id: objectIdSchema.optional(),
    attended: z.boolean().optional()
});

export const AttendanceSchema = z.object({
    lecturePlan: z.array(baseAttendanceSchema).optional(),
    practicalPlan: z.array(baseAttendanceSchema).optional(),
    totalLectureAttendance: z.number().default(0).optional(),
    totalPracticalAttendance: z.number().default(0).optional()
})

export const SubjectSchema = z.object({
    subjectId: objectIdSchema,
    attendance: z.array(AttendanceSchema).optional(),  //This optional will be removed once we will add information of the exams.
    exams: z.array(ExamsSchema).optional()         //This optional will be removed once we will add information of the exams.
})

export const SemesterSchema = z.object({
    semesterId: objectIdSchema,
    semesterNumber: z.number({ required_error: "Semester Number is required" }).nonnegative("Semester number must be greater than 0"),
    //DACHECK : Here we need to confirm, should academic year be of form 2024-25 or 2024-2025
    academicYear: z.string(),
    courseYear: z.nativeEnum(CourseYears),
    subjects: z.array(SubjectSchema),
    fees: FeeSchema
})

export const StudentBaseInfoSchema = z.object({
    studentName: z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    studentId: z.string({ required_error: "Student ID cannot be empty." }).nonempty("Student ID is required"),
    studentPhoneNumber: z.string().optional(),
    fatherName: z.string({ required_error: "Fathers name is required." }).nonempty("Fathers name cannot be empty."),
    fatherPhoneNumber: z.string().optional()
})

export const StudentSchema = z.object({
    studentInfo: StudentBaseInfoSchema,
    courseId: objectIdSchema,
    departmentMetaDataId: objectIdSchema,
    courseName: z.string({ required_error: "Course Name is required." }).nonempty("Course Name is required"),
    courseCode: z.string(),
    startingYear: z.number(),
    currentSemester: z.number().nonnegative("Current Semester of student must be greater than 0"),
    currentAcademicYear: z.string(),
    totalSemester: z.number({ required_error: "Total Number of Semesters is Required." }).nonnegative("Total number of semesters must be non-negative"),
    semester: z.array(SemesterSchema),
    feeStatus: z.nativeEnum(FeeStatuses).default(FeeStatuses.DUE),
    extraBalance: z.number().default(0),
    transactionHistory: objectIdSchema.optional()
})

export const CreateStudentSchema = z.object({
    studentName: z.string({ required_error: "Student Name is required." }).nonempty("Student Name is required."),
    studentPhoneNumber: z.string(),
    fatherName: z.string({ required_error: "Fathers Name is required" }).nonempty("Fathers Name cannot be empty."),
    fatherPhoneNumber: z.string(),
    studentId: z.string(),
    courseCode: z.string(),
    feeId: objectIdSchema,
    dateOfAdmission: z.date()
});

export type ICreateStudentSchema = z.infer<typeof CreateStudentSchema>;
export type IStudentSchema = z.infer<typeof StudentSchema>;
export type IStudentBaseInformation = z.infer<typeof StudentBaseInfoSchema>;
export type ISemesterSchema = z.infer<typeof SemesterSchema>;
export type IAttendanceSchema = z.infer<typeof AttendanceSchema>;
export type IExamSchema = z.infer<typeof ExamsSchema>;
export type IStudentBaseInfoSchema = z.infer<typeof StudentBaseInfoSchema>;
export type ISubjectSchema = z.infer<typeof SubjectSchema>;
export type IBaseAttendanceSchema = z.infer<typeof baseAttendanceSchema>;
export type IBaseExamSchema = z.infer<typeof BaseExamSchema>;