"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryStep3UpdateRequestSchema = exports.enquiryStep1UpdateRequestSchema = exports.enquiryStep1RequestSchema = exports.enquirySchema = exports.tempSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const academicDetailSchema_1 = require("./academicDetailSchema");
const previousCollegeDataSchema_1 = require("./previousCollegeDataSchema");
const singleDocumentSchema_1 = require("./singleDocumentSchema");
exports.tempSchema = zod_1.z.object({
    firstname: zod_1.z.string({ required_error: "Name is required", }).nonempty("here we ar")
});
exports.enquirySchema = zod_1.z.object({
    admissionMode: zod_1.z.nativeEnum(constants_1.AdmissionMode).default(constants_1.AdmissionMode.OFFLINE),
    studentName: zod_1.z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    dateOfEnquiry: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    studentPhoneNumber: commonSchema_1.contactNumberSchema,
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.NOT_TO_MENTION),
    fatherName: zod_1.z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string({ required_error: "Father occupation is required", }).nonempty('Father occupation is required'),
    motherName: zod_1.z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
    motherPhoneNumber: commonSchema_1.contactNumberSchema,
    motherOccupation: zod_1.z.string({ required_error: "Mother occupation is required", }).nonempty('Mother occupation is required'),
    category: zod_1.z.nativeEnum(constants_1.Category),
    address: commonSchema_1.addressSchema,
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference),
    course: zod_1.z.nativeEnum(constants_1.Course),
    previousCollegeData: previousCollegeDataSchema_1.previousCollegeDataSchema.optional(),
    counsellor: zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['other'])]),
    remarks: zod_1.z.string().optional(),
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    applicationStatus: zod_1.z
        .nativeEnum(constants_1.ApplicationStatus)
        .default(constants_1.ApplicationStatus.STEP_1),
    studentFee: commonSchema_1.objectIdSchema.optional(),
    dateOfAdmission: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    documents: zod_1.z.array(singleDocumentSchema_1.singleDocumentSchema).optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    religion: zod_1.z.nativeEnum(constants_1.Religion).optional(),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup).optional(),
    admittedThrough: zod_1.z.nativeEnum(constants_1.AdmittedThrough),
    approvedBy: commonSchema_1.objectIdSchema.optional()
});
// Final schema for request (omitting feesDraftId and making it strict)
exports.enquiryStep1RequestSchema = exports.enquirySchema
    .omit({ studentFee: true, dateOfAdmission: true, bloodGroup: true, admittedThrough: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true })
    .strict();
exports.enquiryStep1UpdateRequestSchema = exports.enquiryStep1RequestSchema.extend({
    id: commonSchema_1.objectIdSchema
}).strict();
exports.enquiryStep3UpdateRequestSchema = exports.enquirySchema.omit({ documents: true, studentFee: true }).extend({
    id: commonSchema_1.objectIdSchema,
}).strict();
