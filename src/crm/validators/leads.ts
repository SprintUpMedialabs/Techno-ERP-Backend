import { z } from 'zod';
import { Course, Gender, LeadType, Locations } from '../../config/constants';
import { contactNumberSchema, objectIdSchema, requestDateSchema } from '../../validators/commonSchema';

export const leadSchema = z.object({
  date:
    z.date(),
  source: z.string().optional(),
  name: z.string().min(1, 'Name field is required'),
  phoneNumber: contactNumberSchema,

  altPhoneNumber: contactNumberSchema
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  location: z.nativeEnum(Locations).optional(),
  course: z.nativeEnum(Course).optional(),
  assignedTo: objectIdSchema, // TODO: need to test this
  leadType: z.nativeEnum(LeadType).default(LeadType.ORANGE),
  remarks: z.string().optional(),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: z
    .date()
    .optional()
});
export type ILead = z.infer<typeof leadSchema>;


export const leadRequestSchema = z.object({
  date: requestDateSchema,
  source: z.string().optional(),
  name: z.string().min(1, 'Name field is required'),
  phoneNumber: contactNumberSchema,
  altPhoneNumber: contactNumberSchema
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  location: z.nativeEnum(Locations).optional(),
  course: z.nativeEnum(Course).optional(),
  assignedTo: objectIdSchema, // TODO: need to test this
  leadType: z.nativeEnum(LeadType).default(LeadType.ORANGE),
  remarks: z.string().optional(),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: requestDateSchema
    .optional()
});
export type ILeadRequest = z.infer<typeof leadRequestSchema>;


export const updateLeadRequestSchema = z.object({
  _id: objectIdSchema,
  name: z.string().min(1, 'Name field is required').optional(),
  phoneNumber: contactNumberSchema
    .optional(),
  altPhoneNumber: contactNumberSchema
    .optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).optional(),
  location: z.nativeEnum(Locations).optional(),
  course: z.nativeEnum(Course).optional(),
  leadType: z.nativeEnum(LeadType).optional(),
  remarks: z.string().optional(),
  nextDueDate:
    requestDateSchema
      .optional()
}).strict(); // strict will restrict extra properties

export type IUpdateLeadRequestSchema = z.infer<typeof updateLeadRequestSchema>;
