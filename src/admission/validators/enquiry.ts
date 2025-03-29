import { optional, z } from 'zod';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, BloodGroup, Category, Course, Gender, Religion } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import {
  addressSchema,
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema';
import { academicDetailsArraySchema, academicDetailSchema } from './academicDetailSchema';
import { previousCollegeDataSchema } from './previousCollegeDataSchema';
import { singleDocumentSchema } from './singleDocumentSchema';


export const enquirySchema = z.object({
  admissionMode: z.nativeEnum(AdmissionMode).default(AdmissionMode.OFFLINE),

  studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
  studentPhoneNumber: contactNumberSchema,
  emailId: z.string().email('Invalid email format').optional(),

  fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
  fatherPhoneNumber: contactNumberSchema,
  fatherOccupation: z.string({ required_error: "Father occupation is required", }).nonempty('Father occupation is required'),

  motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
  motherPhoneNumber: contactNumberSchema,
  motherOccupation: z.string({ required_error: "Mother occupation is required", }).nonempty('Mother occupation is required'),


  dateOfBirth: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ),

  category: z.nativeEnum(Category),
  course: z.nativeEnum(Course),
  reference: z.nativeEnum(AdmissionReference),


  address: addressSchema,
  academicDetails: academicDetailsArraySchema.optional(),


  dateOfEnquiry: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ),

  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),

  previousCollegeData: previousCollegeDataSchema.optional(),

  counsellorName: z.union([objectIdSchema, z.enum(['other'])]),
  telecallerName: z.union([objectIdSchema, z.enum(['other'])]),
  dateOfCounselling: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ).optional(),
  remarks: z.string().optional(),


  applicationStatus: z
    .nativeEnum(ApplicationStatus)
    .default(ApplicationStatus.STEP_1),

  studentFee: objectIdSchema.optional(),
  studentFeeDraft: objectIdSchema.optional(),
  dateOfAdmission: requestDateSchema.transform((date) => convertToMongoDate(date) as Date),

  documents: z.array(singleDocumentSchema).optional(),

  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
  religion: z.nativeEnum(Religion).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  admittedThrough: z.nativeEnum(AdmittedThrough),
  approvedBy: objectIdSchema.optional(),
});

// Final schema for request (omitting feesDraftId and making it strict)
export const enquiryStep1RequestSchema = enquirySchema
  .omit({ studentFee: true, dateOfAdmission: true, bloodGroup: true, admittedThrough: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true })
  .extend({ draftId: objectIdSchema.optional() })
  .strict();

export const enquiryStep1UpdateRequestSchema = enquiryStep1RequestSchema.extend({
  id: objectIdSchema
}).strict();

export const enquiryStep3UpdateRequestSchema = enquirySchema.omit({ documents: true, studentFee: true }).extend({
  id: objectIdSchema,
}).strict();


export const enquiryDraftStep1RequestSchema = enquiryStep1RequestSchema
  .extend({
    counsellorName: z.union([objectIdSchema, z.enum(['other'])]).optional(),
    telecallerName: z.union([objectIdSchema, z.enum(['other'])]).optional(),
    dateOfCounselling: requestDateSchema
      .transform((date) => convertToMongoDate(date) as Date)
      .optional(),
    approvedBy: objectIdSchema.optional(),
    address: addressSchema.partial(),
    academicDetails: z.array(academicDetailSchema.partial()).optional(),
  }).omit({draftId : true}).partial().strict();

export const enquiryDraftStep1UpdateSchema = enquiryDraftStep1RequestSchema.extend({
  id: objectIdSchema
}).partial().strict();

export type IEnquiryUpdateSchema = z.infer<typeof enquiryStep3UpdateRequestSchema>;
export type IEnquiryStep1RequestSchema = z.infer<typeof enquiryStep1RequestSchema>;
export type IEnquiryDraftStep1RequestSchema = z.infer<typeof enquiryDraftStep1RequestSchema>;
export type IEnquiryDraftStep1UpdateSchema = z.infer<typeof enquiryDraftStep1UpdateSchema>;
export type IEnquirySchema = z.infer<typeof enquirySchema>;