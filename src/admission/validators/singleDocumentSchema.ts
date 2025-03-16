import { z } from 'zod';
import { DocumentType } from '../../config/constants';
export const singleDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType),
  documentBuffer: z.instanceof(Buffer)
});

export type ISingleDocumentSchema = z.infer<typeof singleDocumentSchema>;
