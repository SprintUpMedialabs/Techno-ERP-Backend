import { z } from 'zod';
import { AdmissionReference, AdmittedThrough, ApplicationStatus, BloodGroup, Category, Course, Religion } from '../../config/constants';
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

//There was one common TODO to not to include the feeDraftId in schema, agreed and removed.
const baseEnquirySchema = z.object({
  studentName: z.string().min(1, 'Student Name is required'),
  dateOfBirth: requestDateSchema.transform((date) => convertToMongoDate(date) as Date),
  studentPhoneNumber: contactNumberSchema,
  fatherName: z.string().min(1, "Father's Name is required"),
  fatherPhoneNumber: contactNumberSchema,
  fatherOccupation: z.string().min(1, 'Father occupation is required'),
  motherName: z.string().min(1, "Mother's Name is required"),
  motherPhoneNumber: contactNumberSchema,
  motherOccupation: z.string().min(1, 'Mother occupation is required'),
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: 'Invalid category selected' }),
  }),
  address : addressSchema,
  emailId: z.string().email('Invalid email format').optional(),
  reference: z.nativeEnum(AdmissionReference, {
    errorMap: () => ({ message: 'Invalid admission reference' }),
  }),
  course: z.nativeEnum(Course),
  counsellor: z.union([objectIdSchema, z.enum(['other'])]),
  remarks: z.string().optional(),
  academicDetails: academicDetailsArraySchema.optional(),
  applicationStatus: z.nativeEnum(ApplicationStatus, {
    errorMap: () => ({ message: 'Invalid Application Status' }),
  }).default(ApplicationStatus.STEP_1),
  feesDraftId : objectIdSchema.optional()
});

export const enquiryRequestSchema = baseEnquirySchema.extend({
  dateOfBirth: requestDateSchema.transform((date) => convertToMongoDate(date) as Date),
}).strict();

export const enquiryUpdateSchema = baseEnquirySchema.extend({
  id: objectIdSchema,
  dateOfBirth: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
  dateOfAdmission: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
  previousCollegeData: previousCollegeDataSchema.optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
  religion: z.nativeEnum(Religion, {
    errorMap: () => ({ message: 'Invalid religion selected' }),
  }).optional(),
  bloodGroup: z.nativeEnum(BloodGroup, {
    errorMap: () => ({ message: 'Invalid blood group selected' }),
  }).optional(),
  admittedThrough: z.nativeEnum(AdmittedThrough, {
    errorMap: () => ({ message: 'Invalid Admitted Through selected' }),
  }),
  documents: z.array(singleDocumentSchema).optional(),
  preRegNumber: z.string().optional(),
}).partial();

export type IEnquiryUpdateSchema = z.infer<typeof enquiryUpdateSchema>;
export type IEnquiryRequestSchema = z.infer<typeof enquiryRequestSchema>;
