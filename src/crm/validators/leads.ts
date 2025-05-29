import { z } from 'zod';
import { FinalConversionType, Gender, LeadType } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, objectIdSchema, requestDateSchema } from '../../validators/commonSchema';
import { extractLast10Digits, formatAndValidateLeadType, formatDate, formatSource, splitEmails, toTitleCase } from './formators';

export const leadMasterSchema = z.object({
  date: z.date(),
  source: z.string().default('Other'),
  schoolName: z.string().optional(),
  name: z.string().optional(),
  degree: z.string().optional(),
  phoneNumber: z.string().optional(),
  altPhoneNumber: z.string().optional(),
  email: z.string().email('Invalid Email Format').optional(),
  gender: z.nativeEnum(Gender).default(Gender.OTHER),
  area: z.string().optional(),
  city: z.string().optional().default('Other'),
  course: z.string().optional(),
  assignedTo: objectIdSchema.array(),
  leadType: z.nativeEnum(LeadType).default(LeadType.LEFT_OVER),
  leadTypeModifiedDate: z.date().optional(),
  nextDueDate: z.date().optional(),
  footFall: z.boolean().optional(),   //This is referring to Campus Visit
  finalConversion: z.nativeEnum(FinalConversionType).optional().default(FinalConversionType.NO_FOOTFALL),
  remarks: z.array(z.string().optional()).default([]),
  followUpCount: z.number().optional().default(0),
  isCalledToday : z.boolean().optional(),
  isActiveLead : z.boolean().optional()
})

export const leadSchema = leadMasterSchema.omit({
  finalConversion: true,
  footFall: true,
}).strict();

export const yellowLeadSchema = leadMasterSchema.omit({ leadType: true, leadTypeModifiedDate: true }).strict();

export const leadRequestSchema = leadSchema.extend({
  date: requestDateSchema,
  nextDueDate: requestDateSchema.optional()
}).omit({ leadTypeModifiedDate: true });

export const leadSheetSchema = z.object({
  date: z.string().optional().transform(formatDate),
  source: z.string().optional().transform(formatSource),
  name: z.string().optional().transform(toTitleCase),
  phoneNumber: z.string().optional().transform(extractLast10Digits),
  altPhoneNumber: z.string().optional().transform(extractLast10Digits),
  email: z.string().optional(),
  city: z.string().optional().transform(toTitleCase),
  assignedTo: z.string().transform(splitEmails),
  degree: z.string().optional(),
  gender: z.string().optional().transform(val => val?.toUpperCase()),
  followUpCount: z.number().optional().default(0),
    // temporary fields
  course: z.string().optional().transform(val => val?.toUpperCase()),
  area: z.string().optional().transform(toTitleCase),
  leadType: z.string().transform(formatAndValidateLeadType),
  remarks: z
    .string()
    .transform(val => val ? [val] : [])
    .optional(),
  schoolName: z.string().optional().transform(toTitleCase),
});

export const updateLeadRequestSchema = leadRequestSchema.extend({
  _id: objectIdSchema,
  date: requestDateSchema.optional(),
  phoneNumber: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  leadType: z.nativeEnum(LeadType).optional(),
  assignedTo: objectIdSchema.array().optional(),
  nextDueDate: requestDateSchema.transform((date) => convertToMongoDate(date) as Date).optional(),
}).omit({ source: true }).strict(); // strict will restrict extra properties

export const yellowLeadUpdateSchema = yellowLeadSchema.extend({
  _id: objectIdSchema,
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
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