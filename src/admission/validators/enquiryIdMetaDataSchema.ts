import { z } from "zod"
import { FormNoPrefixes, PHOTO } from "../../config/constants";

export const enquiryIdMetaDataSchema = z.object({
  prefix : z.nativeEnum(FormNoPrefixes),
  lastSerialNumber: z.number().int().min(0),
});


export type IEnquiryIdMetaDataSchema = z.infer<typeof enquiryIdMetaDataSchema>;