import { z } from "zod";
import { PhysicalDocumentNoteStatus } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";

export const physicalDocumentNoteRequestSchema = z.object({
    type: z.string(),
    status: z.nativeEnum(PhysicalDocumentNoteStatus),
    dueBy: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
});

export const updateStudentPhysicalDocumentRequestSchema = physicalDocumentNoteRequestSchema.extend({ id: objectIdSchema }).strict();

export const physicalDocumentNoteSchema = z.object({
    type: z.string(),
    status: z.nativeEnum(PhysicalDocumentNoteStatus),
    dueBy: z.date().optional(),
})

export type IPhysicalDocumentNoteSchema = z.infer<typeof physicalDocumentNoteSchema>;