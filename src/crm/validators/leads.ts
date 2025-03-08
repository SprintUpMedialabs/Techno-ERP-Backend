import { z } from 'zod';
import { Gender, LeadType } from '../../config/constants';

export const leadSchema = z.object({
  date: z.union([z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY'), z.date()]),
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
  course: z.string().optional(),
  assignedTo: z.string().min(1, 'Assigned To field is required'),
  leadType: z.nativeEnum(LeadType).default(LeadType.ORANGE),
  remarks: z.string().optional(),
  leadTypeModified: z.string().optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format, expected DD/MM/YYYY')
    .optional()
});

export type ILead = z.infer<typeof leadSchema>;
