import { z } from "zod";

export const baseMarketingSourceWiseAnalyticsSchema = z.object({
    source : z.string(),
    data : z.object({
        totalLeads : z.number(),
        activeLeads : z.number(),
        neutralLeads : z.number(),
        didNotPickLeads : z.number(),
        others : z.number(),     //Left Over Data, Dead Data, Invalid Data, Course NA
        footFall : z.number(),
        totalAdmissions : z.number()
    })
});

export const marketingSourceWiseAnalyticsSchema = z.object({
    type : z.enum(["all-leads", "offline-data", "online-data"]),
    details : z.array(baseMarketingSourceWiseAnalyticsSchema)
})

export type IMarketingSourceWiseAnalyticsSchema = z.infer<typeof marketingSourceWiseAnalyticsSchema>;
export type IBaseMarketingSourceWiseAnalyticsSchema = z.infer<typeof baseMarketingSourceWiseAnalyticsSchema>;