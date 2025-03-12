import { z } from 'zod';
import { Gender, FinalConversionType, CourseType } from '../../config/constants';

export const yellowLeadSchema = z
  .object({
    date: z.date(),
    name: z.string(),
    phoneNumber: z
      .string()
      .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890'),
    altPhoneNumber: z
      .string()
      .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
      .optional(),
    email: z.string().email('Invalid Email Format').optional(),
    gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
    assignedTo: z.string(),
    location: z.string().optional(),
    course: z.nativeEnum(CourseType).optional(),
    campusVisit: z.boolean().default(false),
    nextCallDate: z.date().optional(),
    finalConversion: z.nativeEnum(FinalConversionType).optional(),
    remarks: z.string().optional()
  })
  .strict();

export const yellowLeadUpdateSchema = z
  .object({
    name: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^\+91\d{10}$/, 'Invalid phoneNumber format. Expected: +911234567890')
      .optional(),
    altPhoneNumber: z
      .string()
      .regex(/^\+91\d{10}$/, 'Invalid altPhoneNumber format. Expected: +911234567890')
      .optional(),
    email: z.string().email('Invalid Email Format').optional(),
    gender: z.nativeEnum(Gender).optional(),
    location: z.string().optional(),
    course: z.nativeEnum(CourseType).optional(),
    campusVisit: z.boolean().optional(),
    nextCallDate: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid nextCallDate date format, expected DD/MM/YYYY')
      .optional(),
    finalConversion: z.nativeEnum(FinalConversionType).optional(),
    remarks: z.string().optional()
  })
  .strict();

export type IYellowLead = z.infer<typeof yellowLeadSchema>;
export type IYellowLeadUpdate = z.infer<typeof yellowLeadUpdateSchema>;

//TODO : Remove this after testing filters.
// export type YellowLeadFilter = {
//   leadTypeChangeDateStart?: string;
//   leadTypeChangeDateEnd?: string;
//   finalConversionType?: FinalConversionType | FinalConversionType[];
//   course?: string | string[];
//   location?: string | string[];
//   assignedTo?: string | string[];
//   page?: number;
//   limit?: number;
// };
