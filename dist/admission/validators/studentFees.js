"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feesDraftUpdateSchema = exports.feesDraftRequestSchema = exports.feesUpdateSchema = exports.feesRequestSchema = exports.singleSemSchema = exports.otherFeesSchema = void 0;
const zod_1 = require("zod");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
exports.otherFeesSchema = zod_1.z.object({
    type: zod_1.z.string(),
    feeAmount: zod_1.z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: zod_1.z.number().min(0, 'Final fees to be paid must be greater than 0'),
    feesDepositedTOA: zod_1.z.number().min(0, 'Fees to be deposited must be greater then 0').default(0),
});
exports.singleSemSchema = zod_1.z.object({
    feeAmount: zod_1.z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: zod_1.z.number().min(0, 'Final fees to be paid must be Positive'),
    dueDate: zod_1.z.date().optional(),
    feesPaid: zod_1.z.number().min(0, 'Fees paid must be greater than 0').optional().default(0),
});
const otherFeesSchemaWithoutFeeAmount = exports.otherFeesSchema.omit({ feeAmount: true });
const singleSemSchemaWithoutFeeAmount = exports.singleSemSchema.omit({ feeAmount: true, dueDate: true, feesPaid: true });
const studentFeesSchema = zod_1.z.object({
    otherFees: zod_1.z.array(exports.otherFeesSchema).optional(),
    semWiseFees: zod_1.z.array(exports.singleSemSchema),
    feesClearanceDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    remarks: zod_1.z.string().optional(),
    isFeeApplicable: zod_1.z.boolean().default(false).optional()
});
exports.feesRequestSchema = studentFeesSchema.extend({
    otherFees: zod_1.z.array(otherFeesSchemaWithoutFeeAmount),
    semWiseFees: zod_1.z.array(singleSemSchemaWithoutFeeAmount),
    enquiryId: commonSchema_1.objectIdSchema,
    feesClearanceDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)),
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference).optional(),
    counsellor: zod_1.z.array(zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['Other'])])).optional(),
    telecaller: zod_1.z.array(zod_1.z.union([commonSchema_1.objectIdSchema, zod_1.z.enum(['Other'])])).optional(),
}).strict();
exports.feesUpdateSchema = exports.feesRequestSchema.extend({
    id: commonSchema_1.objectIdSchema,
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference).optional()
}).omit({ enquiryId: true }).strict();
exports.feesDraftRequestSchema = exports.feesRequestSchema.extend({
    otherFees: zod_1.z.array(exports.otherFeesSchema.partial()).optional(),
    semWiseFees: zod_1.z.array(exports.singleSemSchema.partial()).optional(),
    feesClearanceDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    reference: zod_1.z.nativeEnum(constants_1.AdmissionReference).optional()
}).strict();
exports.feesDraftUpdateSchema = exports.feesDraftRequestSchema.extend({
    id: commonSchema_1.objectIdSchema,
}).strict();
