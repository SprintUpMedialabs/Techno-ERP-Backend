import { z } from 'zod';
import { AdmissionReference, AdmittedThrough, ApplicationStatus, BloodGroup, Category, Course, Gender, Religion } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import {
  addressSchema,
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema';
import { academicDetailsArraySchema } from './academicDetailSchema';
import { previousCollegeDataSchema } from './previousCollegeDataSchema';
import { singleDocumentSchema } from './singleDocumentSchema';

const enquirySchema = z.object({
  studentName: z.string().min(1, 'Student Name is required'),

  dateOfBirth: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ),
  dateOfEnquiry: requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ),
  studentPhoneNumber: contactNumberSchema,

  fatherName: z.string().min(1, "Father's Name is required"),
  fatherPhoneNumber: contactNumberSchema,
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  fatherOccupation: z.string().min(1, 'Father occupation is required'),

  motherName: z.string().min(1, "Mother's Name is required"),
  motherPhoneNumber: contactNumberSchema,
  motherOccupation: z.string().min(1, 'Mother occupation is required'),

  category: z.nativeEnum(Category),
  address: addressSchema,
  emailId: z.string().email('Invalid email format').optional(),

  reference: z.nativeEnum(AdmissionReference),
  course: z.nativeEnum(Course),
  previousCollegeData: previousCollegeDataSchema.optional(),

  counsellor: z.union([objectIdSchema, z.enum(['other'])]),
  remarks: z.string().optional(),
  academicDetails: academicDetailsArraySchema.optional(),

  applicationStatus: z
    .nativeEnum(ApplicationStatus)
    .default(ApplicationStatus.STEP_1),

  studentFee: objectIdSchema.optional(),
  dateOfAdmission: requestDateSchema.transform((date) => convertToMongoDate(date) as Date),

  documents: z.array(singleDocumentSchema).optional(),

  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
  religion: z.nativeEnum(Religion).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  admittedThrough: z.nativeEnum(AdmittedThrough),
});

// Final schema for request (omitting feesDraftId and making it strict)
export const enquiryStep1RequestSchema = enquirySchema
  .omit({ studentFee: true, dateOfAdmission: true, bloodGroup: true, admittedThrough: true, aadharNumber: true, religion: true, previousCollegeData: true, documents: true })
  .strict();

export const enquiryStep1UpdateRequestSchema = enquiryStep1RequestSchema.extend({
  id: objectIdSchema
})
  .strict();


export const enquiryStep3UpdateRequestSchema = enquirySchema.omit({ documents: true,studentFee:true }).extend({
  id: objectIdSchema,
}).strict();

export type IEnquiryUpdateSchema = z.infer<typeof enquiryStep3UpdateRequestSchema>;
export type IEnquiryStep1RequestSchema = z.infer<typeof enquiryStep1RequestSchema>;
export type IEnquirySchema = z.infer<typeof enquirySchema>;