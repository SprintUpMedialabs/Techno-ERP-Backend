import { z } from 'zod';
import { Course, FinalConversionType, Gender, Locations, Marketing_Source } from '../../config/constants';
import { contactNumberSchema, objectIdSchema, requestDateSchema } from '../../validators/commonSchema';

export const yellowLeadSchema = z
  .object({
    date: z.date(),
    name: z.string(),
    source : z.nativeEnum(Marketing_Source),
    phoneNumber: contactNumberSchema,
    altPhoneNumber: contactNumberSchema
      .optional(),
    email: z.string().email('Invalid Email Format').optional(),
    gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
    assignedTo: objectIdSchema,
    location: z.nativeEnum(Locations).optional(),
    course: z.nativeEnum(Course).optional(),
    campusVisit: z.boolean().default(false),
    nextDueDate: z.date().optional(),
    finalConversion: z.nativeEnum(FinalConversionType).optional(),
    remarks: z.string().optional()
  })
  .strict();

export const yellowLeadUpdateSchema = z
  .object({
    _id: objectIdSchema,
    name: z.string().optional(),
    phoneNumber: contactNumberSchema
      .optional(),
    altPhoneNumber: contactNumberSchema
      .optional(),
    email: z.string().email('Invalid Email Format').optional(),
    gender: z.nativeEnum(Gender).optional(),
    location: z.nativeEnum(Locations).optional(),
    course: z.nativeEnum(Course).optional(),
    campusVisit: z.boolean().optional(),
    nextDueDate: requestDateSchema
      .optional(),
    finalConversion: z.nativeEnum(FinalConversionType).optional(),
    remarks: z.string().optional()
  })
  .strict();

export type IYellowLead = z.infer<typeof yellowLeadSchema>;
export type IYellowLeadUpdate = z.infer<typeof yellowLeadUpdateSchema>;
