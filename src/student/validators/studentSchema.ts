import { z } from "zod";
import { academicDetailsArraySchema } from "../../admission/validators/academicDetailSchema";
import { entranceExamDetailSchema } from "../../admission/validators/entranceExamDetailSchema";
import { physicalDocumentNoteRequestSchema, physicalDocumentNoteSchema } from "../../admission/validators/physicalDocumentNoteSchema";
import { previousCollegeDataSchema } from "../../admission/validators/previousCollegeDataSchema";
import { singleDocumentSchema } from "../../admission/validators/singleDocumentSchema";
import { AdmissionReference, AdmittedThrough, AreaType, BloodGroup, Category, CourseYears, FeeStatus, Gender, Religion } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { addressSchema, contactNumberSchema, objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
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
    attendance: AttendanceSchema.optional(), //This optional will be removed once we will add information of the exams.
    exams: z.array(ExamsSchema).optional()         //This optional will be removed once we will add information of the exams.
})

export const SemesterSchema = z.object({
    semesterId: objectIdSchema,
    semesterNumber: z.number({ required_error: "Semester Number is required" }).nonnegative("Semester number must be greater than 0"),
    //DACHECK : Here we need to confirm, should academic year be of form 2024-25 or 2024-2025
    academicYear: z.string(),
    courseYear: z.nativeEnum(CourseYears),
    subjects: z.array(SubjectSchema).optional(),
    fees: FeeSchema
})

export const StudentBaseInfoSchema = z.object({
    universityId: z.string({ required_error: "University ID cannot be empty." }).nonempty("University ID is required"),
    photoNo: z.number({ required_error: "Photo Number cannot be empty." }).nonnegative("Photo Number is required"),
    formNo: z.string({ required_error: "Form No cannot be empty." }).nonempty("Form No is required"),
    lurnRegistrationNo: z.string().optional(),


    studentName: z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    studentPhoneNumber: z.string().optional(),

    fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: contactNumberSchema,
    fatherOccupation: z.string().optional(),

    motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: contactNumberSchema.optional(),
    motherOccupation: z.string().optional(),

    emailId: z.string().email('Invalid email format').optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    dateOfBirth: z.union([z.string(), z.date()]).transform((date) => {
        if (date instanceof Date) return date;
        return convertToMongoDate(date) as Date;
    }),
    category: z.nativeEnum(Category),
    references: z.array(z.nativeEnum(AdmissionReference)),
    srAmount: z.number().optional(),

    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    address: addressSchema,
    academicDetails: academicDetailsArraySchema.optional(),


    previousCollegeData: previousCollegeDataSchema.optional(),
    documents: z.array(singleDocumentSchema.extend({ dueBy: z.date().optional() })).optional(),
    physicalDocumentNote: z.array(physicalDocumentNoteSchema).optional(),
    stateOfDomicile: z.string().optional(),
    areaType: z.nativeEnum(AreaType).optional(),
    nationality: z.string().optional(),
    entranceExamDetails: entranceExamDetailSchema.optional(),
    gender: z.nativeEnum(Gender).default(Gender.OTHER),
    religion: z.nativeEnum(Religion).optional(),
    admittedThrough: z.nativeEnum(AdmittedThrough)
})

export const StudentSchema = z.object({
    studentInfo: StudentBaseInfoSchema,
    collegeName : z.string(),
    courseId: objectIdSchema,
    departmentMetaDataId: objectIdSchema,
    courseName: z.string({ required_error: "Course Name is required." }).nonempty("Course Name is required"),
    courseCode: z.string(),
    startingYear: z.number(),
    currentSemester: z.number().nonnegative("Current Semester of student must be greater than 0"),
    currentAcademicYear: z.string(),
    totalSemester: z.number({ required_error: "Total Number of Semesters is Required." }).nonnegative("Total number of semesters must be non-negative"),
    semester: z.array(SemesterSchema),
    feeStatus: z.nativeEnum(FeeStatus).default(FeeStatus.DUE),
    extraBalance: z.number().default(0),
    prevTotalDueAtSemStart: z.number().default(0),
    transactionHistory: z.array(objectIdSchema).optional()
})

export const CreateStudentSchema = z.object({
    courseCode: z.string(),
    feeId: objectIdSchema,
    dateOfAdmission: z.date(),

    collegeName : z.string(),
    
    universityId: z.string({ required_error: "University ID cannot be empty." }).nonempty("University ID is required"),
    photoNo: z.number({ required_error: "Photo Number cannot be empty." }).nonnegative("Photo Number is required"),
    formNo: z.string({ required_error: "Form No cannot be empty." }).nonempty("Form No is required"),

    studentName: z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    studentPhoneNumber: z.string().optional(),

    fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: contactNumberSchema,
    fatherOccupation: z.string().optional(),

    motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: contactNumberSchema.optional(),
    motherOccupation: z.string().optional(),

    emailId: z.string().email('Invalid email format').optional(),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    dateOfBirth: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
    category: z.nativeEnum(Category),
    course: z.string(),
    references: z.array(z.nativeEnum(AdmissionReference)),
    srAmount: z.number().optional(),

    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    address: addressSchema,
    academicDetails: academicDetailsArraySchema.optional(),

    previousCollegeData: previousCollegeDataSchema.optional(),
    documents: z.array(singleDocumentSchema.extend({ dueBy: z.date().optional() })).optional(),
    physicalDocumentNote: z.array(physicalDocumentNoteRequestSchema).optional(),
    stateOfDomicile: z.string().optional(),
    areaType: z.nativeEnum(AreaType).optional(),
    nationality: z.string().optional(),
    entranceExamDetails: entranceExamDetailSchema.optional(),
    gender: z.nativeEnum(Gender).default(Gender.OTHER),
    religion: z.nativeEnum(Religion).optional(),
    admittedThrough: z.nativeEnum(AdmittedThrough)
});


export const updateStudentDetailsRequestSchema = z.object({
    id: objectIdSchema,
    studentName: z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    lurnRegistrationNo: z.string().optional(),
    studentPhoneNumber: z.string().optional(),
    emailId: z.string().email('Invalid email format').optional(),

    fatherName: z.string().optional(),
    fatherPhoneNumber: contactNumberSchema,
    fatherOccupation: z.string().optional(),

    motherName: z.string().optional(),
    motherPhoneNumber: contactNumberSchema.optional(),
    motherOccupation: z.string().optional(),

    gender: z.nativeEnum(Gender).default(Gender.OTHER),
    dateOfBirth: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),

    religion: z.nativeEnum(Religion).optional(),
    category: z.nativeEnum(Category),

    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),

    stateOfDomicile: z.string().optional(),
    areaType: z.nativeEnum(AreaType).optional(),
    nationality: z.string().optional(),

    address: addressSchema,

    academicDetails: academicDetailsArraySchema.optional(),
    entranceExamDetails: entranceExamDetailSchema.optional(),

    references: z.array(z.nativeEnum(AdmissionReference)).optional(),
    srAmount: z.number().optional(),
}).strict();


export type ICreateStudentSchema = z.infer<typeof CreateStudentSchema>;
export type IStudentSchema = z.infer<typeof StudentSchema>;
export type ISemesterSchema = z.infer<typeof SemesterSchema>;
export type IAttendanceSchema = z.infer<typeof AttendanceSchema>;
export type IExamSchema = z.infer<typeof ExamsSchema>;
export type IStudentBaseInfoSchema = z.infer<typeof StudentBaseInfoSchema>;
export type ISubjectSchema = z.infer<typeof SubjectSchema>;
export type IBaseAttendanceSchema = z.infer<typeof baseAttendanceSchema>;
export type IBaseExamSchema = z.infer<typeof BaseExamSchema>;
export type IUpdateStudentDetailsRequestSchema = z.infer<typeof updateStudentDetailsRequestSchema>;