"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellowLeadUpdateSchema = exports.updateLeadRequestSchema = exports.leadSheetSchema = exports.leadRequestSchema = exports.yellowLeadSchema = exports.leadSchema = exports.leadMasterSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const formators_1 = require("./formators");
exports.leadMasterSchema = zod_1.z.object({
    date: zod_1.z.date(),
    source: zod_1.z.string().default('Other'),
    schoolName: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    degree: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    altPhoneNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.OTHER),
    area: zod_1.z.string().optional(),
    city: zod_1.z.string().optional().default('Other'),
    course: zod_1.z.string().optional(),
    assignedTo: commonSchema_1.objectIdSchema.array(),
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).default(constants_1.LeadType.LEFT_OVER),
    leadTypeModifiedDate: zod_1.z.date().optional(),
    nextDueDate: zod_1.z.date().optional(),
    footFall: zod_1.z.boolean().optional(), //This is referring to Campus Visit
    finalConversion: zod_1.z.nativeEnum(constants_1.FinalConversionType).optional().default(constants_1.FinalConversionType.NO_FOOTFALL),
    remarks: zod_1.z.array(zod_1.z.string().optional()).default([]),
    followUpCount: zod_1.z.number().optional().default(0),
    isCalledToday: zod_1.z.boolean().optional(),
    isActiveLead: zod_1.z.boolean().optional()
});
exports.leadSchema = exports.leadMasterSchema.omit({
    finalConversion: true,
    footFall: true,
}).strict();
exports.yellowLeadSchema = exports.leadMasterSchema.omit({ leadType: true, leadTypeModifiedDate: true }).strict();
exports.leadRequestSchema = exports.leadSchema.extend({
    date: commonSchema_1.requestDateSchema,
    nextDueDate: commonSchema_1.requestDateSchema.optional()
}).omit({ leadTypeModifiedDate: true });
exports.leadSheetSchema = zod_1.z.object({
    date: zod_1.z.string().optional().transform(formators_1.formatDate),
    source: zod_1.z.string().optional().transform(formators_1.formatSource),
    name: zod_1.z.string().optional().transform(formators_1.toTitleCase),
    phoneNumber: zod_1.z.string().optional().transform(formators_1.extractLast10Digits),
    altPhoneNumber: zod_1.z.string().optional().transform(formators_1.extractLast10Digits),
    email: zod_1.z.string().optional(),
    city: zod_1.z.string().optional().transform(formators_1.toTitleCase),
    assignedTo: zod_1.z.string().transform(formators_1.splitEmails),
    degree: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional().transform(val => val === null || val === void 0 ? void 0 : val.toUpperCase()),
    followUpCount: zod_1.z.number().optional().default(0),
    // temporary fields
    course: zod_1.z.string().optional().transform(val => val === null || val === void 0 ? void 0 : val.toUpperCase()),
    area: zod_1.z.string().optional().transform(formators_1.toTitleCase),
    leadType: zod_1.z.string().transform(formators_1.formatAndValidateLeadType),
    remarks: zod_1.z
        .string()
        .transform(val => val ? [val] : [])
        .optional(),
    schoolName: zod_1.z.string().optional().transform(formators_1.toTitleCase),
});
exports.updateLeadRequestSchema = exports.leadRequestSchema.extend({
    _id: commonSchema_1.objectIdSchema,
    date: commonSchema_1.requestDateSchema.optional(),
    phoneNumber: zod_1.z.string().optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).optional(),
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).optional(),
    assignedTo: commonSchema_1.objectIdSchema.array().optional(),
    nextDueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
}).omit({ source: true }).strict(); // strict will restrict extra properties
exports.yellowLeadUpdateSchema = exports.yellowLeadSchema.extend({
    _id: commonSchema_1.objectIdSchema,
    name: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    assignedTo: commonSchema_1.objectIdSchema.array().optional(),
    date: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
    nextDueDate: commonSchema_1.requestDateSchema.transform((date) => (0, convertDateToFormatedDate_1.convertToMongoDate)(date)).optional(),
}).strict();
