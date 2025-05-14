import { z } from "zod";
import { MarketingAnalyticsEnum } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const BaseMarketingAnalyticsSchema = z.object({
    date : z.date(),
    data : z.array(z.object({
        userId : objectIdSchema,
        noOfCalls : z.number()
    }))
})

export const MarketingAnalyticsSchema = z.object({
    type : z.nativeEnum(MarketingAnalyticsEnum),
    lastUpdatedAt : z.date(),
    details : z.array(BaseMarketingAnalyticsSchema)
});

export type IBaseMarketingAnalyticsSchema = z.infer<typeof BaseMarketingAnalyticsSchema>;
export type IMarketingAnalyticsSchema = z.infer<typeof MarketingAnalyticsSchema>;

