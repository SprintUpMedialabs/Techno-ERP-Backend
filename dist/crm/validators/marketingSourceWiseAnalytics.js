"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingSourceWiseAnalyticsSchema = exports.baseMarketingSourceWiseAnalyticsSchema = void 0;
const zod_1 = require("zod");
exports.baseMarketingSourceWiseAnalyticsSchema = zod_1.z.object({
    source: zod_1.z.string(),
    data: zod_1.z.object({
        totalLeads: zod_1.z.number(),
        activeLeads: zod_1.z.number(),
        neutralLeads: zod_1.z.number(),
        didNotPickLeads: zod_1.z.number(),
        others: zod_1.z.number(), //Left Over Data, Dead Data, Invalid Data, Course NA
        footFall: zod_1.z.number(),
        totalAdmissions: zod_1.z.number()
    })
});
exports.marketingSourceWiseAnalyticsSchema = zod_1.z.object({
    type: zod_1.z.enum(["all-leads", "offline-data", "online-data"]),
    details: zod_1.z.array(exports.baseMarketingSourceWiseAnalyticsSchema)
});
