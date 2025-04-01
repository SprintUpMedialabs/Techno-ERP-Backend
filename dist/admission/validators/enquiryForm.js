"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryUpdateSchema = exports.enquiryRequestSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema"); // Import the date validation schema
const academicDetailSchema_1 = require("./academicDetailSchema");
const addressSchema_1 = require("./addressSchema");
const previousCollegeDataSchema_1 = require("./previousCollegeDataSchema");
const singleDocumentSchema_1 = require("./singleDocumentSchema");
exports.enquiryRequestSchema = zod_1.z
    .object({
    //Date field is there but it should be new Date() by default.
    studentName: zod_1.z.string().min(1, 'Student Name is required'),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    studentPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherName: zod_1.z.string().min(1, "Father's Name is required"),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema,
    fatherOccupation: zod_1.z.string().min(1, 'Father occupation is required'),
    motherName: zod_1.z.string().min(1, "Mother's Name is required"),
    motherPhoneNumber: commonSchema_1.contactNumberSchema,
    motherOccupation: zod_1.z.string().min(1, 'Mother occupation is required'),
    category: zod_1.z.nativeEnum(constants_1.Category, {
        errorMap: () => ({ message: 'Invalid category selected' })
    }),
    // address: z.string().min(5, 'Address is required'),
    address: addressSchema_1.addressSchema,
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference, {
        errorMap: () => ({ message: 'Invalid admission reference' })
    }),
    course: zod_1.z.nativeEnum(constants_1.Course),
    counsellor: zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['other'])]),
    remarks: zod_1.z.string().optional(),
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    applicationStatus: zod_1.z.nativeEnum(constants_1.ApplicationStatus, {
        errorMap: () => ({ message: 'Invalid Application Status' })
    }).default(constants_1.ApplicationStatus.STEP_1)
})
    .strict();
exports.enquiryUpdateSchema = zod_1.z
    .object({
    _id: commonSchema_1.objectIdSchema,
    studentName: zod_1.z.string().optional(),
    dateOfBirth: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    studentPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    fatherName: zod_1.z.string().optional(),
    fatherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    fatherOccupation: zod_1.z.string().optional(),
    motherName: zod_1.z.string().optional(),
    motherPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    motherOccupation: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(constants_1.Category).optional(),
    emailId: zod_1.z.string().email('Invalid email format').optional(),
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference).optional(),
    dateOfAdmission: commonSchema_1.requestDateSchema
        .transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date))
        .optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    counsellor: zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['other'])]).optional(),
    remarks: zod_1.z.string().optional(),
    academicDetails: academicDetailSchema_1.academicDetailsArraySchema.optional(),
    previousCollegeData: previousCollegeDataSchema_1.previousCollegeDataSchema.optional(),
    address: addressSchema_1.addressSchema.optional(),
    aadharNumber: zod_1.z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    religion: zod_1.z.nativeEnum(constants_1.Religion, {
        errorMap: () => ({ message: 'Invalid religion selected' }),
    }).optional(),
    bloodGroup: zod_1.z.nativeEnum(constants_1.BloodGroup, {
        errorMap: () => ({ message: 'Invalid blood group selected' }),
    }).optional(),
    admittedThrough: zod_1.z.nativeEnum(constants_1.AdmittedThrough, {
        errorMap: () => ({ message: ' Invalid Admitted Through selected' }),
    }),
    documents: zod_1.z.array(singleDocumentSchema_1.singleDocumentSchema).optional(),
    preRegNumber: zod_1.z.string().optional(),
    applicationStatus: zod_1.z.nativeEnum(constants_1.ApplicationStatus, {
        errorMap: () => ({ message: 'Invalid Application Status' })
    })
})
    .strict();
