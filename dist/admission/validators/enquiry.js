"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryDraftStep1UpdateSchema = exports.enquiryDraftStep1RequestSchema = exports.enquiryDraftStep3Schema = exports.otpSchemaForStep3 = exports.enquiryStep3UpdateRequestSchema = exports.enquiryStep1UpdateRequestSchema = exports.enquiryStep1RequestSchema = exports.enquirySchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const academicDetailSchema_1 = require("./academicDetailSchema");
const entranceExamDetailSchema_1 = require("./entranceExamDetailSchema");
const physicalDocumentNoteSchema_1 = require("./physicalDocumentNoteSchema");
const previousCollegeDataSchema_1 = require("./previousCollegeDataSchema");
const singleDocumentSchema_1 = require("./singleDocumentSchema");
exports.enquirySchema = zod_1.z.object({
    admissionMode: zod_1.z.nativeEnum(constants_1.AdmissionMode).default(constants_1.AdmissionMode.OFFLINE),
    studentName: zod_1.z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: commonSchema_1.contactNumberSchema,
    emailId: zod_1.z.string().email('Invalid email format'),
    fatherName: zod_1.z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string().optional(),
    motherName: zod_1.z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    motherOccupation: zod_1.z.string().optional(),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    category: zod_1.z.nativeEnum(constants_1.Category),
    course: zod_1.z.string().nonempty('Course can not be empty'),
    references: zod_1.z.array(zod_1.z.nativeEnum(constants_1.AdmissionReference)).optional(),
    srAmount: zod_1.z.number().optional(),
    address: commonSchema_1.addressSchema,
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    dateOfEnquiry: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.OTHER),
    previousCollegeData: previousCollegeDataSchema_1.previousCollegeDataSchema.optional(),
    stateOfDomicile: zod_1.z.string().default(constants_1.StatesOfIndia.UTTAR_PRADESH),
    areaType: zod_1.z.nativeEnum(constants_1.AreaType).optional(),
    nationality: zod_1.z.string().default('INDIAN'),
    entranceExamDetails: entranceExamDetailSchema_1.entranceExamDetailSchema.optional(),
    counsellor: zod_1.z.array(zod_1.z.string()).default([]),
    telecaller: zod_1.z.array(zod_1.z.string()).default([]),
    enquiryRemark: zod_1.z.string().optional(),
    feeDetailsRemark: zod_1.z.string().optional(),
    registarOfficeRemark: zod_1.z.string().optional(),
    financeOfficeRemark: zod_1.z.string().optional(),
    applicationStatus: zod_1.z
        .nativeEnum(constants_1.ApplicationStatus)
        .default(constants_1.ApplicationStatus.STEP_1),
    studentFee: commonSchema_1.objectIdSchema.optional(),
    studentFeeDraft: commonSchema_1.objectIdSchema.optional(),
    dateOfAdmission: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    documents: zod_1.z.array(singleDocumentSchema_1.singleDocumentSchema).optional(),
    physicalDocumentNote: zod_1.z.array(physicalDocumentNoteSchema_1.physicalDocumentNoteSchema).optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits'),
    religion: zod_1.z.nativeEnum(constants_1.Religion).optional(),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup).optional(),
    admittedBy: zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['Other'])]).optional(),
    isFeeApplicable: zod_1.z.boolean().default(true),
    admittedThrough: zod_1.z.nativeEnum(constants_1.AdmittedThrough).default(constants_1.AdmittedThrough.DIRECT).optional()
});
// Final schema for request (omitting feesDraftId and making it strict)
exports.enquiryStep1RequestSchema = exports.enquirySchema
    .omit({ studentFee: true, studentFeeDraft: true, bloodGroup: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true, applicationStatus: true, entranceExamDetails: true, nationality: true, stateOfDomicile: true, areaType: true, admittedBy: true })
    .extend({ id: commonSchema_1.objectIdSchema.optional(), emailId: zod_1.z.string().email('Invalid email format').optional() })
    .strict();
exports.enquiryStep1UpdateRequestSchema = exports.enquiryStep1RequestSchema.extend({
    id: commonSchema_1.objectIdSchema,
    emailId: zod_1.z.string().email('Invalid email format').optional()
}).strict();
exports.enquiryStep3UpdateRequestSchema = exports.enquirySchema.omit({ documents: true, studentFee: true }).extend({
    id: commonSchema_1.objectIdSchema,
    emailId: zod_1.z.string().email('Invalid email format'),
    physicalDocumentNote: zod_1.z.array(physicalDocumentNoteSchema_1.physicalDocumentNoteRequestSchema).optional()
}).strict();
exports.otpSchemaForStep3 = zod_1.z.object({
    otp: zod_1.z.string(),
    id: commonSchema_1.objectIdSchema
});
exports.enquiryDraftStep3Schema = exports.enquiryStep3UpdateRequestSchema
    .extend({
    address: commonSchema_1.addressSchema.partial().optional(),
    academicDetails: zod_1.z.array(academicDetailSchema_1.academicDetailSchema.partial()).optional(),
    studentName: zod_1.z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: commonSchema_1.contactNumberSchema,
    counsellor: zod_1.z.array(zod_1.z.string()).optional(),
    telecaller: zod_1.z.array(zod_1.z.string()).optional(),
    dateOfAdmission: commonSchema_1.requestDateSchema
        .transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date))
        .optional(),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date))
        .optional(),
    entranceExamDetails: entranceExamDetailSchema_1.entranceExamDetailSchema
        .partial()
        .optional()
})
    .partial()
    .strict();
exports.enquiryDraftStep1RequestSchema = exports.enquiryStep1RequestSchema
    .extend({
    studentName: zod_1.z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: commonSchema_1.contactNumberSchema,
    counsellor: zod_1.z.array(zod_1.z.string()).optional(),
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    telecaller: zod_1.z.array(zod_1.z.string()).optional(),
    address: commonSchema_1.addressSchema.partial().optional(),
    academicDetails: zod_1.z.array(academicDetailSchema_1.academicDetailSchema.partial()).optional(),
}).omit({ id: true }).partial().strict();
exports.enquiryDraftStep1UpdateSchema = exports.enquiryDraftStep1RequestSchema.extend({
    id: commonSchema_1.objectIdSchema // This is referring to _id in the enquiryDraftsTable
}).partial().strict();
