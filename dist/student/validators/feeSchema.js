"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeSchema = exports.BaseFeeSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
exports.BaseFeeSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(constants_1.FinanceFeeType),
    schedule: zod_1.z.nativeEnum(constants_1.FinanceFeeSchedule),
    actualFee: zod_1.z.number(),
    finalFee: zod_1.z.number(),
    paidAmount: zod_1.z.number(),
    remark: zod_1.z.string(),
    dueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
});
exports.FeeSchema = zod_1.z.object({
    details: zod_1.z.array(exports.BaseFeeSchema),
    dueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    paidAmount: zod_1.z.number(),
    totalFinalFee: zod_1.z.number(),
});
