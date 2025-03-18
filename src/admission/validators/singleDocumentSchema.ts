import { z } from 'zod';
import { DocumentType } from '../../config/constants';
import { objectIdSchema } from '../../validators/commonSchema';

export const singleDocumentSchema = z.object({
  studentId: objectIdSchema,
  type: z.nativeEnum(DocumentType),
  documentBuffer: z.object({
    buffer: z.instanceof(Buffer),
    mimetype: z.string(),
    size: z.number()
      .positive()
      .max(5 * 1024 * 1024, { message: 'File size must be less than 5MB' }),
    originalname: z.string(),
  }).refine(
    (file) => ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.mimetype),
    { message: 'Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed.' }
  )
});

export type ISingleDocumentSchema = z.infer<typeof singleDocumentSchema>;
