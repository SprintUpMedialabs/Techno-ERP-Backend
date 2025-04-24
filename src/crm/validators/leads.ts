import { z } from 'zod';
import { Course, FinalConversionType, Gender, LeadType } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, objectIdSchema, requestDateSchema } from '../../validators/commonSchema';

export const leadMasterSchema = z.object({
  date: z.date(),
  source: z.string().default('Other'),
  schoolName: z.string().optional(),
  name: z.string().nonempty('Name field is required').regex(/^[A-Za-z\s]+$/, 'Name can only contain alphabets and spaces'),
  phoneNumber: contactNumberSchema,
  altPhoneNumber: contactNumberSchema.optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  area: z.string().optional(),
  city: z.string().optional().default('Other'),
  course: z.nativeEnum(Course).optional(),
  assignedTo: objectIdSchema.array(),
  leadType: z.nativeEnum(LeadType).default(LeadType.OPEN),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: z.date().optional(),
  footFall: z.boolean().optional(),   //This is referring to Campus Visit
  finalConversion: z.nativeEnum(FinalConversionType).optional().default(FinalConversionType.NO_FOOTFALL),
  remarks: z.string().optional(),
  leadsFollowUpCount: z.number().optional().default(0),
  yellowLeadsFollowUpCount: z.number().optional().default(0)
})

export const leadSchema = leadMasterSchema.omit({
  finalConversion: true,
  footFall: true,
  yellowLeadsFollowUpCount: true
}).strict();

export const yellowLeadSchema = leadMasterSchema.omit({ leadType: true, leadsFollowUpCount: true, leadTypeModifiedDate: true }).strict();

export const leadRequestSchema = leadSchema.extend({
  date: requestDateSchema,
  nextDueDate: requestDateSchema.optional()
}).omit({ leadTypeModifiedDate: true })

export const leadSheetSchema = z.object({
  date: z.string().transform(formatDate),
  source: z.string().transform(toTitleCase),
  name: z.string().transform(toTitleCase),
  phoneNumber: z.string().transform(extractLast10Digits),
  altPhoneNumber: z.string().transform(extractLast10Digits).optional(),
  email: z.string().email().optional(),
  city: z.string().transform(toTitleCase),
  assignedTo: z.string().transform(splitEmails),
  gender: z.string().optional().transform(val => val?.toUpperCase()),
});

export const updateLeadRequestSchema = leadRequestSchema.extend({
  _id: objectIdSchema,
  date: requestDateSchema.optional(),
  phoneNumber: contactNumberSchema.optional(),
  gender: z.nativeEnum(Gender).optional(),
  leadType: z.nativeEnum(LeadType).optional(),
  assignedTo: objectIdSchema.array().optional(),
  nextDueDate: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
}).omit({ source: true }).strict(); // strict will restrict extra properties

export const yellowLeadUpdateSchema = yellowLeadSchema.extend({
  _id: objectIdSchema,
  name: z.string().optional(),
  phoneNumber: contactNumberSchema.optional(),
  assignedTo: objectIdSchema.array().optional(),
  date: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
  nextDueDate: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
}).strict();

export type ILeadMaster = z.infer<typeof leadMasterSchema>;
export type ILead = z.infer<typeof leadSchema>;
export type IYellowLead = z.infer<typeof yellowLeadSchema>;
export type IUpdateLeadRequestSchema = z.infer<typeof updateLeadRequestSchema>;
export type ILeadRequest = z.infer<typeof leadRequestSchema>;
export type IYellowLeadUpdate = z.infer<typeof yellowLeadUpdateSchema>;
export type ISheetLeadRequest = z.infer<typeof leadSheetSchema>;


