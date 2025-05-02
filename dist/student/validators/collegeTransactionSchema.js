"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegeTransactionSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.CollegeTransactionSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    dateTime: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    feeAction: zod_1.z.nativeEnum(constants_1.FeeActions),
    transactionID: zod_1.z.number(),
    amount: zod_1.z.string(),
    txnType: zod_1.z.string(),
    remark: zod_1.z.string()
});
