"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCollegeTransactionSchema = exports.CollegeTransactionSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.CollegeTransactionSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    dateTime: zod_1.z.date().default(new Date()).optional(),
    feeAction: zod_1.z.nativeEnum(constants_1.FeeActions),
    transactionID: zod_1.z.number().optional(),
    amount: zod_1.z.number(),
    txnType: zod_1.z.nativeEnum(constants_1.TransactionTypes),
    remark: zod_1.z.string().optional(),
    actionedBy: commonSchema_1.objectIdSchema.optional(),
    courseName: zod_1.z.string().optional(),
    courseCode: zod_1.z.string().optional(),
    transactionSettlementHistory: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        amount: zod_1.z.number()
    })).optional(),
    courseYear: zod_1.z.string().optional()
});
exports.CreateCollegeTransactionSchema = exports.CollegeTransactionSchema;
