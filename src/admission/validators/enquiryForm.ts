import { z } from 'zod';
import { AdmissionReference, AdmittedThrough, ApplicationStatus, BloodGroup, Category, Course, Religion } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import {
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema'; // Import the date validation schema
import { academicDetailsArraySchema } from './academicDetailSchema';
import { addressSchema } from './addressSchema';
import { previousCollegeDataSchema } from './previousCollegeDataSchema';
import { singleDocumentSchema } from './singleDocumentSchema';


export const enquiryRequestSchema = z
  .object({
    //Date field is there but it should be new Date() by default.
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
      errorMap: () => ({ message: 'Invalid category selected' })
    }),
    // address: z.string().min(5, 'Address is required'),
    address: addressSchema,
    emailId: z.string().email('Invalid email format').optional(),
    reference: z.nativeEnum(AdmissionReference, {
      errorMap: () => ({ message: 'Invalid admission reference' })
    }),
    course: z.nativeEnum(Course),
    counsellor: z.union([objectIdSchema, z.enum(['other'])]),
    remarks: z.string().optional(),
    academicDetails: academicDetailsArraySchema.optional(),
    applicationStatus: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({ message: 'Invalid Application Status' })
    }).default(ApplicationStatus.STEP_1),
    feesDraftId: objectIdSchema.optional()
  })
  .strict();

export const enquiryUpdateSchema = z
  .object({
    _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
    studentName: z.string().optional(),
    dateOfBirth: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
    studentPhoneNumber: contactNumberSchema.optional(),
    fatherName: z.string().optional(),
    fatherPhoneNumber: contactNumberSchema.optional(),
    fatherOccupation: z.string().optional(),
    motherName: z.string().optional(),
    motherPhoneNumber: contactNumberSchema.optional(),
    motherOccupation: z.string().optional(),
    category: z.nativeEnum(Category).optional(),
    emailId: z.string().email('Invalid email format').optional(),
    reference: z.nativeEnum(AdmissionReference).optional(),
    dateOfAdmission: requestDateSchema
      .transform((date) => convertToMongoDate(date) as Date)
      .optional(),
    course: z.nativeEnum(Course).optional(),
    counsellor: z.union([objectIdSchema, z.enum(['other'])]).optional(),
    remarks: z.string().optional(),
    academicDetails: academicDetailsArraySchema.optional(),
    previousCollegeData: previousCollegeDataSchema.optional(),
    address: addressSchema.optional(),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
    religion: z.nativeEnum(Religion, {
      errorMap: () => ({ message: 'Invalid religion selected' }),
    }).optional(),
    bloodGroup: z.nativeEnum(BloodGroup, {
      errorMap: () => ({ message: 'Invalid blood group selected' }),
    }).optional(),
    admittedThrough: z.nativeEnum(AdmittedThrough, {
      errorMap: () => ({ message: ' Invalid Admitted Through selected' }),
    }),
    documents: z.array(singleDocumentSchema).optional(),
    preRegNumber: z.string().optional(),
    applicationStatus: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({ message: 'Invalid Application Status' })
    }),
    feesDraftId: objectIdSchema.optional()
  })
  .strict();

export type IEnquiryUpdateSchema = z.infer<typeof enquiryUpdateSchema>;
export type IEnquiryRequestSchema = z.infer<typeof enquiryRequestSchema>;
