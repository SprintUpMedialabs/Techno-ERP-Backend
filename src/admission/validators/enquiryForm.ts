import { z } from 'zod';
import {
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema'; // Import the date validation schema
import { AcademicDetails, AdmissionReference, Category, Course } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';

export const academicDetailSchema = z.object({
  academicDetails: z.nativeEnum(AcademicDetails), // Only allows fixed values
  schoolCollegeName: z.string().min(1, 'School/College Name is required'),
  universityBoardName: z.string().min(1, 'University/Board Name is required'),
  passingYear: z
    .number()
    .int()
    .refine((year) => year.toString().length === 4, {
      message: 'Passing Year must be a valid 4-digit year'
    }),
  percentageObtained: z
    .number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
  subjects: z
    .array(z.string().min(1, 'Subject name is required'))
    .nonempty('Subjects cannot be empty')
});

// Array schema
export const academicDetailsArraySchema = z.array(academicDetailSchema);

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
      errorMap: () => ({ message: "Invalid category selected" }),
    }),
    address: z.string().min(5, 'Address is required'),
    emailId: z.string().email('Invalid email format').optional(),
    reference: z.nativeEnum(AdmissionReference, {
      errorMap: () => ({ message: "Invalid admission reference" }),
    }),
    // DTODO: here we need to add msg for enums [do this in marketing module also]
    course: z.nativeEnum(Course, {
      errorMap: () => ({ message: "Invalid course selected" }),
    }),    
    counsellor: z.union([objectIdSchema, z.enum(['other'])]), // DTODO: here error msg is not coming up properly but fine this is not our current prioriy
    remarks: z.string().optional(),
    academicDetails: academicDetailsArraySchema.optional()
  })
  .strict();

export const enquiryUpdateSchema = z
  .object({
    _id: objectIdSchema,
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
    address: z.string().optional(),
    emailId: z.string().email('Invalid email format').optional(),
    reference: z.nativeEnum(AdmissionReference).optional(),
    course: z.nativeEnum(Course).optional(),
    counsellor: z.union([objectIdSchema, z.enum(['other'])]).optional(),
    remarks: z.string().optional(),
    academicDetails: academicDetailsArraySchema.optional()
  })
  .strict();

export type IEnquiryUpdateSchema = z.infer<typeof enquiryUpdateSchema>;
export type IEnquiryRequestSchema = z.infer<typeof enquiryRequestSchema>;
export type IAcademicDetailSchema = z.infer<typeof academicDetailSchema>;
