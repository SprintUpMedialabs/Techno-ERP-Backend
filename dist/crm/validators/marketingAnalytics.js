"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingAnalyticsSchema = exports.BaseMarketingAnalyticsSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.BaseMarketingAnalyticsSchema = zod_1.z.object({
    date: zod_1.z.date(),
    data: zod_1.z.array(zod_1.z.object({
        userId: commonSchema_1.objectIdSchema,
        noOfCalls: zod_1.z.number()
    }))
});
exports.MarketingAnalyticsSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(constants_1.MarketingAnalyticsEnum),
    lastUpdatedAt: zod_1.z.date(),
    details: zod_1.z.array(exports.BaseMarketingAnalyticsSchema)
});
