import { z } from 'zod';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, BloodGroup, Category, Course, Gender, Religion } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import {
  addressSchema,
  contactNumberSchema,
  objectIdSchema,
  requestDateSchema
} from '../../validators/commonSchema';
import { singleDocumentSchema } from '../../admission/validators/singleDocumentSchema';
import { academicDetailsArraySchema } from '../../admission/validators/academicDetailSchema';
import { previousCollegeDataSchema } from '../../admission/validators/previousCollegeDataSchema';


export const studentSchema = z.object({
  universityId : z.string(),
  formNo : z.string(),
  photoNo : z.number().min(100, 'Invalid Photo Number'),
  admissionMode: z.nativeEnum(AdmissionMode).default(AdmissionMode.OFFLINE),
  studentName: z.string({ required_error: "Student Name is required", }).nonempty('Student Name is required'),
  semester : z.string(),
  dateOfBirth: z.date().optional(),
  dateOfEnquiry: z.date().optional(),
  
  studentPhoneNumber: contactNumberSchema,
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),

  fatherName: z.string({ required_error: "Father Name is required", }).nonempty("Father's Name is required"),
  fatherPhoneNumber: contactNumberSchema,
  fatherOccupation: z.string({ required_error: "Father occupation is required", }).nonempty('Father occupation is required'),

  motherName: z.string({ required_error: "Mother's Name is required", }).nonempty("Mother's Name is required"),
  motherPhoneNumber: contactNumberSchema,
  motherOccupation: z.string({ required_error: "Mother occupation is required", }).nonempty('Mother occupation is required'),

  category: z.nativeEnum(Category),
  address: addressSchema,
  emailId: z.string().email('Invalid email format').optional(),

  reference: z.nativeEnum(AdmissionReference),
  course: z.nativeEnum(Course),
  previousCollegeData: previousCollegeDataSchema.optional(),

  counsellor: z.union([objectIdSchema, z.enum(['other'])]).optional(),
  remarks: z.string().optional(),
  academicDetails: academicDetailsArraySchema.optional(),

  applicationStatus: z
    .nativeEnum(ApplicationStatus)
    .default(ApplicationStatus.STEP_1),

  studentFee: objectIdSchema.optional(),
  dateOfAdmission: z.date().optional(),
  documents: z.array(singleDocumentSchema).optional(),

  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar Number must be exactly 12 digits').optional(),
  religion: z.nativeEnum(Religion).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  admittedThrough: z.nativeEnum(AdmittedThrough).optional(),
  approvedBy: objectIdSchema.optional(),
  preRegNumber : z.string().optional()            //This will be added here
});


export const updateStudentSchema = studentSchema
  .omit({
    universityId: true,   //Do not allow these fields to be changed as they are part of one time generation process.
    formNo: true,
    photoNo: true,
  })
  .extend({
    id: objectIdSchema, 
    dateOfAdmission :  requestDateSchema.transform((date) =>
      convertToMongoDate(date) as Date
    ),
    dateOfEnquiry :  requestDateSchema.transform((date) =>
      convertToMongoDate(date) as Date
    ),
    dateOfBirth : requestDateSchema.transform((date) =>
      convertToMongoDate(date) as Date
    )
  }).partial(); 


export type IStudentUpdateSchema = z.infer<typeof updateStudentSchema>;
export type IStudentSchema = z.infer<typeof studentSchema>;