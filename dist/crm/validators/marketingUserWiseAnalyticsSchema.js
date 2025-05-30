"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingUserWiseAnalyticsSchema = exports.baseMarketingUserWiseAnalyticsSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.baseMarketingUserWiseAnalyticsSchema = zod_1.z.object({
    userId: commonSchema_1.objectIdSchema,
    userFirstName: zod_1.z.string(),
    userLastName: zod_1.z.string(),
    totalCalls: zod_1.z.number(),
    newLeadCalls: zod_1.z.number(),
    activeLeadCalls: zod_1.z.number(),
    nonActiveLeadCalls: zod_1.z.number(),
    totalFootFall: zod_1.z.number(),
    totalAdmissions: zod_1.z.number(),
    analyticsRemark: zod_1.z.string()
});
exports.marketingUserWiseAnalyticsSchema = zod_1.z.object({
    date: zod_1.z.date(),
    data: zod_1.z.array(exports.baseMarketingUserWiseAnalyticsSchema).default([])
});
