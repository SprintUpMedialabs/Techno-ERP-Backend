import {z} from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { Course } from "../../config/constants";

export const approveEnquirySchema = z.object({
    id : objectIdSchema,
    course : z.nativeEnum(Course)
})

export type IApproveEnquirySchema = z.infer<typeof approveEnquirySchema>;