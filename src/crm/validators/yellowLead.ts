import { z } from 'zod';
import { Gender, FinalConversionType } from '../../config/constants';

export const yellowLeadSchema = z.object({
  srNo: z.number(),
  leadTypeChangeDate: z.union([
    z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY'),
    z.date()
  ]),
  name: z.string(),
  phoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890'),
  altPhoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890')
    .optional(),
  email: z.string().email('Invalid Email Format'),
  gender: z.nativeEnum(Gender).default(Gender.NOT_TO_MENTION),
  assignedTo: z.string().optional(),  // TODO: it mandatory
  location: z.string().optional(),
  course: z.string().optional(),
  campusVisit: z.boolean().default(false),
  nextCallDate: z.union([
    z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY'),
    z.date()
  ]),
  finalConversion: z.nativeEnum(FinalConversionType).optional(),
  remarks: z.string().optional()
});

export type IYellowLead = z.infer<typeof yellowLeadSchema>;
