import { z } from 'zod';
import { CourseType, Gender, LeadType } from '../../config/constants';
import { objectIdSchema } from '../../validators/objectIdSchema';

export const leadSchema = z.object({
  date:
    z.date(),
  source: z.string().optional(),
  name: z.string().min(1, 'Name field is required'),
  phoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890'),
  altPhoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  location: z.string().optional(),
  course: z.nativeEnum(CourseType).optional(),
  assignedTo: objectIdSchema,
  leadType: z.nativeEnum(LeadType).default(LeadType.ORANGE),
  remarks: z.string().optional(),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: z
    .date()
    .optional()
});
export type ILead = z.infer<typeof leadSchema>;

export const leadRequestSchema = z.object({
  date: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY'),
  source: z.string().optional(),
  name: z.string().min(1, 'Name field is required'),
  phoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890'),
  altPhoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  location: z.string().optional(),
  course: z.nativeEnum(CourseType).optional(),
  assignedTo: objectIdSchema,
  leadType: z.nativeEnum(LeadType).default(LeadType.ORANGE),
  remarks: z.string().optional(),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY')
    .optional()
});
export type ILeadRequest = z.infer<typeof leadRequestSchema>;

export const updateLeadRequestSchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1, 'Name field is required').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
    .optional(),
  altPhoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).optional(),
  location: z.string().optional(),
  course: z.nativeEnum(CourseType).optional(),
  leadType: z.nativeEnum(LeadType).optional(),
  remarks: z.string().optional(),
  nextDueDate:
    z.string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY')
      .optional()
}).strict(); // strict will restrict extra properties

export type IUpdateLeadRequestSchema = z.infer<typeof updateLeadRequestSchema>;
