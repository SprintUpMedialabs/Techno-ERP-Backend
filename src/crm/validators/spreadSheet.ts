import * as z from "zod";
export const spreadSheetSchema = z.object({
    lastIdxMarketingSheet : z.number()
});

export type ISpreadSheetMetaData = z.infer<typeof spreadSheetSchema>;