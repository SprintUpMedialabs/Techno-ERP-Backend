import { z } from 'zod';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, AreaType, BloodGroup, Category, Gender, Religion, StatesOfIndia } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import {
  addressSchema,
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema';
import { academicDetailsArraySchema, academicDetailSchema } from './academicDetailSchema';
import { entranceExamDetailSchema } from './entranceExamDetailSchema';
import { physicalDocumentNoteRequestSchema, physicalDocumentNoteSchema } from './physicalDocumentNoteSchema';
import { previousCollegeDataSchema } from './previousCollegeDataSchema';
import { singleDocumentSchema } from './singleDocumentSchema';


export const enquirySchema = z.object({

  admissionMode: z.nativeEnum(AdmissionMode).default(AdmissionMode.OFFLINE).optional(),

  studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required').optional(),
  studentPhoneNumber: contactNumberSchema.optional(),
  emailId: z.string().email('Invalid email format').optional(),

  fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required").optional(),
  fatherPhoneNumber: contactNumberSchema.optional(),
  fatherOccupation: z.string().optional(),

  motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required").optional(),
  motherPhoneNumber: contactNumberSchema.optional(),
  motherOccupation: z.string().optional(),


  dateOfBirth: requestDateSchema.transform((date) =>
    convertToMongoDate(date??"") as Date 
  ).optional(),

  category: z.nativeEnum(Category).optional(),
  course: z.string().nonempty('Course can not be empty').optional(),
  references: z.array(z.nativeEnum(AdmissionReference)).optional(),
  srAmount: z.number().optional(),

  address: addressSchema.optional(),

  academicDetails: academicDetailsArraySchema.optional(),

  dateOfEnquiry: requestDateSchema.transform((date) =>
    convertToMongoDate(date??"") as Date
  ).optional(),

  gender: z.nativeEnum(Gender).default(Gender.OTHER).optional(),

  previousCollegeData: previousCollegeDataSchema.optional(),

  stateOfDomicile: z.string().default(StatesOfIndia.UTTAR_PRADESH).optional(),
  areaType: z.nativeEnum(AreaType).optional(),
  nationality: z.string().default('INDIAN').optional(),

  entranceExamDetails: entranceExamDetailSchema.optional(),

  counsellor: z.array(z.string()).default([]).optional(),
  telecaller: z.array(z.string()).default([]).optional(),
  enquiryRemark: z.string().optional(),
  feeDetailsRemark: z.string().optional(),
  registarOfficeRemark: z.string().optional(),
  financeOfficeRemark: z.string().optional(),

  applicationStatus: z
    .nativeEnum(ApplicationStatus)
    .default(ApplicationStatus.STEP_1).optional(),

  studentFee: objectIdSchema.optional(),
  studentFeeDraft: objectIdSchema.optional(),
  dateOfAdmission: requestDateSchema.transform((date) => convertToMongoDate(date??"") as Date).optional(),

  documents: z.array(singleDocumentSchema).optional(),

  physicalDocumentNote: z.array(physicalDocumentNoteSchema).optional(),

  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
  religion: z.nativeEnum(Religion).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  admittedBy: z.union([objectIdSchema, z.enum(['Other'])]).optional(),
  isFeeApplicable: z.boolean().default(true).optional(),
  admittedThrough: z.nativeEnum(AdmittedThrough).default(AdmittedThrough.DIRECT).optional()
});


// Final schema for request (omitting feesDraftId and making it strict)
export const enquiryStep1RequestSchema = enquirySchema
  .omit({ studentFee: true, studentFeeDraft: true, dateOfAdmission: true, bloodGroup: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true, applicationStatus: true, entranceExamDetails: true, nationality: true, stateOfDomicile: true, areaType: true, admittedBy: true })
  .extend({ id: objectIdSchema.optional(), emailId: z.string().email('Invalid email format').optional() })
  .strict();


export const enquiryStep1UpdateRequestSchema = enquiryStep1RequestSchema.extend({
  id: objectIdSchema,
  emailId: z.string().email('Invalid email format').optional(),
}).strict();



export const enquiryStep3UpdateRequestSchema = enquirySchema.omit({ documents: true, studentFee: true, dateOfAdmission: true }).extend({
  id: objectIdSchema,
  physicalDocumentNote: z.array(physicalDocumentNoteRequestSchema).optional()
}).strict();

export const otpSchemaForStep3 = z.object({
  otp: z.string(),
  id: objectIdSchema
});


export const enquiryDraftStep3Schema = enquiryStep3UpdateRequestSchema
  .extend({
    address: addressSchema.partial().optional(),
    academicDetails: z.array(academicDetailSchema.partial()).optional(),
    studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: contactNumberSchema,
    counsellor: z.array(z.string()).optional(),
    telecaller: z.array(z.string()).optional(),
    dateOfBirth: requestDateSchema.transform((date) =>
      convertToMongoDate(date??"") as Date ?? "")
      .optional(),
    entranceExamDetails: entranceExamDetailSchema
      .partial()
      .optional()
  })
  .partial()
  .strict();


export const enquiryDraftStep1RequestSchema = enquiryStep1RequestSchema
  .extend({
    counsellor: z.array(z.string()).optional(),
    course: z.string().optional(),
    telecaller: z.array(z.string()).optional(),
    emailId: z.string().email('Invalid email format').optional(),
    address: addressSchema.partial().optional(),
    academicDetails: z.array(academicDetailSchema.partial()).optional(),
  }).omit({ id: true }).partial().strict();

export const enquiryDraftStep1UpdateSchema = enquiryDraftStep1RequestSchema.extend({
  id: objectIdSchema      // This is referring to _id in the enquiryDraftsTable
}).partial().strict();

export type IEnquiryStep1RequestSchema = z.infer<typeof enquiryStep1RequestSchema>;
export type IEnquiryDraftStep1RequestSchema = z.infer<typeof enquiryDraftStep1RequestSchema>;
export type IEnquiryDraftStep1UpdateSchema = z.infer<typeof enquiryDraftStep1UpdateSchema>;
export type IEnquirySchema = z.infer<typeof enquirySchema>;
export type IEnquiryDraftStep3Schema = z.infer<typeof enquiryDraftStep3Schema>;
