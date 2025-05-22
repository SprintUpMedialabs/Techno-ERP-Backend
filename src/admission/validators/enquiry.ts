import { z } from 'zod';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, AreaType, BloodGroup, Category, Course, Gender, Religion, StatesOfIndia } from '../../config/constants';
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
import { entranceExamDetailSchema } from './entranceExamDetailSchema';
import { physicalDocumentNoteRequestSchema, physicalDocumentNoteSchema } from './physicalDocumentNoteSchema';


export const enquirySchema = z.object({

  admissionMode: z.nativeEnum(AdmissionMode).default(AdmissionMode.OFFLINE),

  studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
  studentPhoneNumber: contactNumberSchema,
  emailId: z.string().email('Invalid email format'),

  fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
  fatherPhoneNumber: contactNumberSchema,
  fatherOccupation: z.string({ required_error: "Father occupation is required", }).nonempty('Father occupation is required'),

  motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
  motherPhoneNumber: contactNumberSchema.optional(),
  motherOccupation: z.string({ required_error: "Mother occupation is required", }).nonempty('Mother occupation is required'),


  dateOfBirth: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ),

  category: z.nativeEnum(Category),
  course: z.string().nonempty('Course can not be empty'),
  reference: z.nativeEnum(AdmissionReference),


  address: addressSchema,

  academicDetails: academicDetailsArraySchema.optional(),

  dateOfEnquiry: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ).optional(),

  gender: z.nativeEnum(Gender).default(Gender.OTHER),

  previousCollegeData: previousCollegeDataSchema.optional(),

  stateOfDomicile: z.nativeEnum(StatesOfIndia).default(StatesOfIndia.UTTAR_PRADESH),
  areaType: z.nativeEnum(AreaType).optional(),
  nationality: z.string().default('INDIAN'),

  entranceExamDetails: entranceExamDetailSchema.optional(),

  counsellor: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
  telecaller: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
  remarks: z.string().optional(),

  applicationStatus: z
    .nativeEnum(ApplicationStatus)
    .default(ApplicationStatus.STEP_1),

  studentFee: objectIdSchema.optional(),
  studentFeeDraft: objectIdSchema.optional(),
  dateOfAdmission: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),

  documents: z.array(singleDocumentSchema).optional(),

  physicalDocumentNote: z.array(physicalDocumentNoteSchema).optional(),

  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits'),
  religion: z.nativeEnum(Religion).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  admittedBy: z.union([objectIdSchema, z.enum(['Other'])]).optional(),
  isFeeApplicable : z.boolean().default(true)
});


// Final schema for request (omitting feesDraftId and making it strict)
export const enquiryStep1RequestSchema = enquirySchema
  .omit({ studentFee: true, studentFeeDraft: true, dateOfAdmission: true, bloodGroup: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true, applicationStatus: true, entranceExamDetails: true, nationality: true, stateOfDomicile: true, areaType: true, admittedBy: true })
  .extend({ id: objectIdSchema.optional() })
  .strict();


export const enquiryStep1UpdateRequestSchema = enquiryStep1RequestSchema.extend({
  id: objectIdSchema
}).strict();



export const enquiryStep3UpdateRequestSchema = enquirySchema.omit({ documents: true, studentFee: true }).extend({
  id: objectIdSchema,
  physicalDocumentNote: z.array(physicalDocumentNoteRequestSchema).optional()
}).strict();


export const enquiryDraftStep3Schema = enquiryStep3UpdateRequestSchema
  .extend({
    address: addressSchema.partial().optional(),
    academicDetails: z.array(academicDetailSchema.partial()).optional(),
    studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: contactNumberSchema,
    counsellor: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
    telecaller: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
    dateOfAdmission: requestDateSchema
      .transform((date) => convertToMongoDate(date) as Date)
      .optional(),
    dateOfBirth: requestDateSchema.transform((date) =>
      convertToMongoDate(date) as Date)
      .optional(),
    entranceExamDetails: entranceExamDetailSchema
      .partial()
      .optional()
  })
  .partial()
  .strict();


export const enquiryDraftStep1RequestSchema = enquiryStep1RequestSchema
  .extend({
    studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
    studentPhoneNumber: contactNumberSchema,
    counsellor: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
    telecaller: z.array(z.union([objectIdSchema, z.enum(['Other'])])).optional(),
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
