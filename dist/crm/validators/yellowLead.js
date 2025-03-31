"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellowLeadUpdateSchema = exports.yellowLeadSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.yellowLeadSchema = zod_1.z
    .object({
    date: zod_1.z.date(),
    name: zod_1.z.string(),
    source: zod_1.z.nativeEnum(constants_1.Marketing_Source),
    phoneNumber: commonSchema_1.contactNumberSchema,
    altPhoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.NOT_TO_MENTION),
    assignedTo: commonSchema_1.objectIdSchema,
    location: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    campusVisit: zod_1.z.boolean().default(false),
    nextDueDate: zod_1.z.date().optional(),
    finalConversion: zod_1.z.nativeEnum(constants_1.FinalConversionType).optional(),
    remarks: zod_1.z.string().optional()
})
    .strict();
exports.yellowLeadUpdateSchema = zod_1.z
    .object({
    _id: commonSchema_1.objectIdSchema,
    name: zod_1.z.string().optional(),
    phoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    altPhoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).optional(),
    location: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    campusVisit: zod_1.z.boolean().optional(),
    nextDueDate: commonSchema_1.requestDateSchema
        .optional(),
    finalConversion: zod_1.z.nativeEnum(constants_1.FinalConversionType).optional(),
    remarks: zod_1.z.string().optional()
})
    .strict();
