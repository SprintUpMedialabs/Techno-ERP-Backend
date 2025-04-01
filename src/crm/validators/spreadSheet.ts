import * as z from 'zod';

export const spreadSheetSchema = z.object({
  name: z.string(),
  lastIdxMarketingSheet: z.number()
});

export type ISpreadSheetMetaData = z.infer<typeof spreadSheetSchema>;
