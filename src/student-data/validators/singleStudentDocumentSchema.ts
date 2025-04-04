import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { z } from "zod";
import { DocumentType } from "../../config/constants";
export const singleStudentDocumentRequestSchema = z.object({
    type: z.nativeEnum(DocumentType),
    dueBy : z.date().optional(),
    fileUrl : z.string().optional(),
});
  

export const singleStudentDocumentUpdateSchema = singleStudentDocumentRequestSchema.extend({
  studentId : objectIdSchema,
  type : z.nativeEnum(DocumentType),
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
  ).optional(),
  dueBy : requestDateSchema.transform((date) =>
    convertToMongoDate(date) as Date
  ).optional(),
}).omit({fileUrl : true});


export type ISingleStudentDocumentRequestSchema = z.infer<typeof singleStudentDocumentRequestSchema>;
export type ISingleStudentDocumentUpdateSchema = z.infer<typeof singleStudentDocumentUpdateSchema>;