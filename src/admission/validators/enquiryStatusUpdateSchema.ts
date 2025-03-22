import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { ApplicationStatus } from "../../config/constants";

export const enquiryStatusUpdateSchema = z.object({
    id : objectIdSchema,
    oldStatus : z.nativeEnum(ApplicationStatus),
    newStatus : z.nativeEnum(ApplicationStatus)
})


export type IEnquiryStatusUpdateSchema = z.infer<typeof enquiryStatusUpdateSchema>;