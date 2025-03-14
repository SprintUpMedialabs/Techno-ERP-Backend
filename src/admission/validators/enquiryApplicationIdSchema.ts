import {z} from "zod"
import { ApplicationIdPrefix } from "../../config/constants";

export const enquiryApplicationIdSchema = z.object({
    prefix: z.nativeEnum(ApplicationIdPrefix),
    lastSerialNumber: z.number().int().min(0),
  });
  

export type IEnquiryApplicationIdSchema = z.infer<typeof enquiryApplicationIdSchema>;