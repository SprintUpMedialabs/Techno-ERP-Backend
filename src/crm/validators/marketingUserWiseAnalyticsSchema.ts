import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const baseMarketingUserWiseAnalyticsSchema = z.object({
    userId : objectIdSchema,
    userFirstName : z.string(),
    userLastName : z.string(),
    totalCalls : z.number(),
    newLeadCalls : z.number(),
    activeLeadCalls : z.number(),
    nonActiveLeadCalls : z.number(),
    totalFootFall : z.number(),
    totalAdmissions : z.number()
});

export const marketingUserWiseAnalyticsSchema = z.object({
    date : z.date(),
    data : z.array(baseMarketingUserWiseAnalyticsSchema).default([])
})

export type IBaseMarketingUserWiseAnalyticsSchema = z.infer<typeof baseMarketingUserWiseAnalyticsSchema>;
export type IMarketingUserWiseAnalyticsSchema = z.infer<typeof marketingUserWiseAnalyticsSchema>;