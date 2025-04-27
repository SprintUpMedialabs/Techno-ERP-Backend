import { z } from "zod";
import { PhysicalDocumentNoteStatus } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { requestDateSchema } from "../../validators/commonSchema";

export const physicalDocumentNoteSchema = z.object({
    type: z.string(),
    status: z.nativeEnum(PhysicalDocumentNoteStatus),
    dueBy: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
});

export type IPhysicalDocumentNoteSchema = z.infer<typeof physicalDocumentNoteSchema>;