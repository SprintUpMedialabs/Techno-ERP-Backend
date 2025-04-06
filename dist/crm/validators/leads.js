"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellowLeadUpdateSchema = exports.updateLeadRequestSchema = exports.leadRequestSchema = exports.yellowLeadSchema = exports.leadSchema = exports.leadMasterSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.leadMasterSchema = zod_1.z.object({
    date: zod_1.z.date(),
    source: zod_1.z.nativeEnum(constants_1.Marketing_Source).optional(),
    name: zod_1.z.string().min(1, 'Name field is required'),
    phoneNumber: commonSchema_1.contactNumberSchema,
    altPhoneNumber: commonSchema_1.contactNumberSchema.optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.NOT_TO_MENTION),
    area: zod_1.z.string().optional(),
    city: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    assignedTo: commonSchema_1.objectIdSchema, // TODO: need to test this
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).default(constants_1.LeadType.OPEN),
    leadTypeModifiedDate: zod_1.z.date().optional(),
    nextDueDate: zod_1.z.date().optional(),
    footFall: zod_1.z.boolean().optional(), //This is referring to Campus Visit
    finalConversion: zod_1.z.nativeEnum(constants_1.FinalConversionType).optional().default(constants_1.FinalConversionType.NO_FOOTFALL),
    remarks: zod_1.z.string().optional(),
    leadsFollowUpCount: zod_1.z.number().optional().default(0),
    yellowLeadsFollowUpCount: zod_1.z.number().optional().default(0)
});
exports.leadSchema = exports.leadMasterSchema.omit({
    finalConversion: true,
    remarks: true,
    footFall: true,
    yellowLeadsFollowUpCount: true
}).strict();
exports.yellowLeadSchema = exports.leadMasterSchema.omit({ leadType: true, leadsFollowUpCount: true }).strict();
exports.leadRequestSchema = exports.leadSchema.extend({
    date: commonSchema_1.requestDateSchema,
    nextDueDate: commonSchema_1.requestDateSchema.optional()
});
exports.updateLeadRequestSchema = exports.leadRequestSchema.extend({
    _id: commonSchema_1.objectIdSchema,
    date: commonSchema_1.requestDateSchema.optional(),
    phoneNumber: commonSchema_1.contactNumberSchema.optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).optional(),
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).optional(),
    assignedTo: commonSchema_1.objectIdSchema.optional(),
    nextDueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
}).omit({ source: true }).strict(); // strict will restrict extra properties
exports.yellowLeadUpdateSchema = exports.yellowLeadSchema.extend({
    _id: commonSchema_1.objectIdSchema,
    name: zod_1.z.string().optional(),
    phoneNumber: commonSchema_1.contactNumberSchema.optional(),
    campusVisit: zod_1.z.boolean().optional(),
    assignedTo: commonSchema_1.objectIdSchema.optional(),
    date: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    nextDueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
}).strict();
