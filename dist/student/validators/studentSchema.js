"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentDetailsRequestSchema = exports.CreateStudentSchema = exports.StudentSchema = exports.StudentBaseInfoSchema = exports.SemesterSchema = exports.SubjectSchema = exports.AttendanceSchema = exports.baseAttendanceSchema = exports.ExamsSchema = exports.BaseExamSchema = void 0;
const zod_1 = require("zod");
const academicDetailSchema_1 = require("../../admission/validators/academicDetailSchema");
const entranceExamDetailSchema_1 = require("../../admission/validators/entranceExamDetailSchema");
const physicalDocumentNoteSchema_1 = require("../../admission/validators/physicalDocumentNoteSchema");
const previousCollegeDataSchema_1 = require("../../admission/validators/previousCollegeDataSchema");
const singleDocumentSchema_1 = require("../../admission/validators/singleDocumentSchema");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const feeSchema_1 = require("./feeSchema");
exports.BaseExamSchema = zod_1.z.object({
    type: zod_1.z.string().optional(),
    marks: zod_1.z.number().optional()
});
exports.ExamsSchema = zod_1.z.object({
    theory: zod_1.z.array(exports.BaseExamSchema).optional(),
    practical: zod_1.z.array(exports.BaseExamSchema).optional(),
    totalMarks: zod_1.z.number().default(0).optional()
});
exports.baseAttendanceSchema = zod_1.z.object({
    id: commonSchema_1.objectIdSchema.optional(),
    attended: zod_1.z.boolean().optional()
});
exports.AttendanceSchema = zod_1.z.object({
    lecturePlan: zod_1.z.array(exports.baseAttendanceSchema).optional(),
    practicalPlan: zod_1.z.array(exports.baseAttendanceSchema).optional(),
    totalLectureAttendance: zod_1.z.number().default(0).optional(),
    totalPracticalAttendance: zod_1.z.number().default(0).optional()
});
exports.SubjectSchema = zod_1.z.object({
    subjectId: commonSchema_1.objectIdSchema,
    attendance: exports.AttendanceSchema.optional(), //This optional will be removed once we will add information of the exams.
    exams: zod_1.z.array(exports.ExamsSchema).optional() //This optional will be removed once we will add information of the exams.
});
exports.SemesterSchema = zod_1.z.object({
    semesterId: commonSchema_1.objectIdSchema,
    semesterNumber: zod_1.z.number({ required_error: "Semester Number is required" }).nonnegative("Semester number must be greater than 0"),
    //DACHECK : Here we need to confirm, should academic year be of form 2024-25 or 2024-2025
    academicYear: zod_1.z.string(),
    courseYear: zod_1.z.nativeEnum(constants_1.CourseYears),
    subjects: zod_1.z.array(exports.SubjectSchema).optional(),
    fees: feeSchema_1.FeeSchema
});
exports.StudentBaseInfoSchema = zod_1.z.object({
    universityId: zod_1.z.string({ required_error: "University ID cannot be empty." }).nonempty("University ID is required"),
    photoNo: zod_1.z.number({ required_error: "Photo Number cannot be empty." }).nonnegative("Photo Number is required"),
    formNo: zod_1.z.string({ required_error: "Form No cannot be empty." }).nonempty("Form No is required"),
    lurnRegistrationNo: zod_1.z.string().optional(),
    studentName: zod_1.z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    studentPhoneNumber: zod_1.z.string().optional(),
    fatherName: zod_1.z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string().optional(),
    motherName: zod_1.z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    motherOccupation: zod_1.z.string().optional(),
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup).optional(),
    dateOfBirth: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).transform((date) => {
        if (date instanceof Date)
            return date;
        return (0, convertDateToFormatedDate_1.convertToMongoDate)(date);
    }),
    category: zod_1.z.nativeEnum(constants_1.Category),
    references: zod_1.z.array(zod_1.z.nativeEnum(constants_1.AdmissionReference)),
    srAmount: zod_1.z.number().optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    address: commonSchema_1.addressSchema,
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    previousCollegeData: previousCollegeDataSchema_1.previousCollegeDataSchema.optional(),
    documents: zod_1.z.array(singleDocumentSchema_1.singleDocumentSchema.extend({ dueBy: zod_1.z.date().optional() })).optional(),
    physicalDocumentNote: zod_1.z.array(physicalDocumentNoteSchema_1.physicalDocumentNoteSchema).optional(),
    stateOfDomicile: zod_1.z.string().optional(),
    areaType: zod_1.z.nativeEnum(constants_1.AreaType).optional(),
    nationality: zod_1.z.string().optional(),
    entranceExamDetails: entranceExamDetailSchema_1.entranceExamDetailSchema.optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.OTHER),
    religion: zod_1.z.nativeEnum(constants_1.Religion).optional(),
    admittedThrough: zod_1.z.nativeEnum(constants_1.AdmittedThrough)
});
exports.StudentSchema = zod_1.z.object({
    studentInfo: exports.StudentBaseInfoSchema,
    collegeName: zod_1.z.string(),
    courseId: commonSchema_1.objectIdSchema,
    departmentMetaDataId: commonSchema_1.objectIdSchema,
    courseName: zod_1.z.string({ required_error: "Course Name is required." }).nonempty("Course Name is required"),
    courseCode: zod_1.z.string(),
    startingYear: zod_1.z.number(),
    currentSemester: zod_1.z.number().nonnegative("Current Semester of student must be greater than 0"),
    currentAcademicYear: zod_1.z.string(),
    totalSemester: zod_1.z.number({ required_error: "Total Number of Semesters is Required." }).nonnegative("Total number of semesters must be non-negative"),
    semester: zod_1.z.array(exports.SemesterSchema),
    feeStatus: zod_1.z.nativeEnum(constants_1.FeeStatus).default(constants_1.FeeStatus.DUE),
    extraBalance: zod_1.z.number().default(0),
    prevTotalDueAtSemStart: zod_1.z.number().default(0),
    transactionHistory: zod_1.z.array(commonSchema_1.objectIdSchema).optional()
});
exports.CreateStudentSchema = zod_1.z.object({
    courseCode: zod_1.z.string(),
    feeId: commonSchema_1.objectIdSchema,
    dateOfAdmission: zod_1.z.date(),
    collegeName: zod_1.z.string(),
    universityId: zod_1.z.string({ required_error: "University ID cannot be empty." }).nonempty("University ID is required"),
    photoNo: zod_1.z.number({ required_error: "Photo Number cannot be empty." }).nonnegative("Photo Number is required"),
    formNo: zod_1.z.string({ required_error: "Form No cannot be empty." }).nonempty("Form No is required"),
    studentName: zod_1.z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    studentPhoneNumber: zod_1.z.string().optional(),
    fatherName: zod_1.z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string().optional(),
    motherName: zod_1.z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    motherOccupation: zod_1.z.string().optional(),
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup).optional(),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    category: zod_1.z.nativeEnum(constants_1.Category),
    course: zod_1.z.string(),
    references: zod_1.z.array(zod_1.z.nativeEnum(constants_1.AdmissionReference)),
    srAmount: zod_1.z.number().optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    address: commonSchema_1.addressSchema,
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    previousCollegeData: previousCollegeDataSchema_1.previousCollegeDataSchema.optional(),
    documents: zod_1.z.array(singleDocumentSchema_1.singleDocumentSchema.extend({ dueBy: zod_1.z.date().optional() })).optional(),
    physicalDocumentNote: zod_1.z.array(physicalDocumentNoteSchema_1.physicalDocumentNoteRequestSchema).optional(),
    stateOfDomicile: zod_1.z.string().optional(),
    areaType: zod_1.z.nativeEnum(constants_1.AreaType).optional(),
    nationality: zod_1.z.string().optional(),
    entranceExamDetails: entranceExamDetailSchema_1.entranceExamDetailSchema.optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.OTHER),
    religion: zod_1.z.nativeEnum(constants_1.Religion).optional(),
    admittedThrough: zod_1.z.nativeEnum(constants_1.AdmittedThrough)
});
exports.updateStudentDetailsRequestSchema = zod_1.z.object({
    id: commonSchema_1.objectIdSchema,
    studentName: zod_1.z.string({ required_error: "Student Name is required." }).nonempty("Student Name cannot be empty"),
    lurnRegistrationNo: zod_1.z.string().optional(),
    studentPhoneNumber: zod_1.z.string().optional(),
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    fatherName: zod_1.z.string().optional(),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string().optional(),
    motherName: zod_1.z.string().optional(),
    motherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    motherOccupation: zod_1.z.string().optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.OTHER),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    religion: zod_1.z.nativeEnum(constants_1.Religion).optional(),
    category: zod_1.z.nativeEnum(constants_1.Category),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup).optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    stateOfDomicile: zod_1.z.string().optional(),
    areaType: zod_1.z.nativeEnum(constants_1.AreaType).optional(),
    nationality: zod_1.z.string().optional(),
    address: commonSchema_1.addressSchema,
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    entranceExamDetails: entranceExamDetailSchema_1.entranceExamDetailSchema.optional(),
    references: zod_1.z.array(zod_1.z.nativeEnum(constants_1.AdmissionReference)).optional(),
    srAmount: zod_1.z.number().optional(),
}).strict();
