"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentTransactionSchema = exports.BaseTransactionSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.BaseTransactionSchema = zod_1.z.object({
    transactionID: zod_1.z.number(),
    dateTime: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    feeAction: zod_1.z.nativeEnum(constants_1.FeeActions),
    amount: zod_1.z.number(),
    txnType: zod_1.z.nativeEnum(constants_1.TransactionTypes),
    remark: zod_1.z.string().optional()
});
exports.StudentTransactionSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    transactions: zod_1.z.array(exports.BaseTransactionSchema)
});
