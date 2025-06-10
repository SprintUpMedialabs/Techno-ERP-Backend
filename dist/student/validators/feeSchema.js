"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditFeeBreakUpSchema = exports.FetchFeeHistorySchema = exports.FeeSchema = exports.BaseFeeSchema = exports.FeeUpdateHistorySchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.FeeUpdateHistorySchema = zod_1.z.object({
    updatedAt: zod_1.z.date(),
    extraAmount: zod_1.z.number(),
    updatedFee: zod_1.z.number(),
    updatedBy: commonSchema_1.objectIdSchema
});
exports.BaseFeeSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(constants_1.FinanceFeeType),
    schedule: zod_1.z.nativeEnum(constants_1.FinanceFeeSchedule),
    actualFee: zod_1.z.number(),
    finalFee: zod_1.z.number(),
    paidAmount: zod_1.z.number(),
    remark: zod_1.z.string(),
    feeUpdateHistory: zod_1.z.array(exports.FeeUpdateHistorySchema)
});
exports.FeeSchema = zod_1.z.object({
    details: zod_1.z.array(exports.BaseFeeSchema),
    dueDate: zod_1.z.union([zod_1.z.date(), zod_1.z.undefined()]),
    paidAmount: zod_1.z.number(),
    totalFinalFee: zod_1.z.number(),
});
exports.FetchFeeHistorySchema = zod_1.z.object({
    studentId: commonSchema_1.objectIdSchema,
    semesterId: commonSchema_1.objectIdSchema,
    detailId: commonSchema_1.objectIdSchema
});
exports.EditFeeBreakUpSchema = zod_1.z.object({
    studentId: commonSchema_1.objectIdSchema,
    semesterId: commonSchema_1.objectIdSchema,
    detailId: commonSchema_1.objectIdSchema,
    amount: zod_1.z.number()
});
