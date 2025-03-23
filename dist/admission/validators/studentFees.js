"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feesDraftUpdateSchema = exports.feesDraftRequestSchema = exports.singleSemSchema = exports.otherFeesSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.otherFeesSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(constants_1.FeeType),
    feeAmount: zod_1.z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: zod_1.z.number().min(0, 'Final fees to be paid must be greater than 0'),
    feesDepositedTOA: zod_1.z.number().min(0, 'Fees to be deposited must be greater then 0').default(0),
    remarks: zod_1.z.string()
});
exports.singleSemSchema = zod_1.z.object({
    feeAmount: zod_1.z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: zod_1.z.number().min(0, 'Final fees to be paid must be Positive')
});
const otherFeesSchemaWithoutFeeAmount = exports.otherFeesSchema.omit({ feeAmount: true });
const singleSemSchemaWithoutFeeAmount = exports.singleSemSchema.omit({ feeAmount: true });
const studentFeesSchema = zod_1.z.object({
    otherFees: zod_1.z.array(exports.otherFeesSchema).optional(),
    semWiseFees: zod_1.z.array(exports.singleSemSchema),
    feeStatus: zod_1.z.nativeEnum(constants_1.FeeStatus).default(constants_1.FeeStatus.DRAFT).optional(),
});
exports.feesDraftRequestSchema = studentFeesSchema.omit({ feeStatus: true }).extend({
    otherFees: zod_1.z.array(otherFeesSchemaWithoutFeeAmount),
    semWiseFees: zod_1.z.array(singleSemSchemaWithoutFeeAmount),
    enquiryId: commonSchema_1.objectIdSchema
});
exports.feesDraftUpdateSchema = exports.feesDraftRequestSchema.extend({
    id: commonSchema_1.objectIdSchema
});
