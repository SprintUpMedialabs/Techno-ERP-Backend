"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadRequestSchema = exports.leadRequestSchema = exports.leadSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
exports.leadSchema = zod_1.z.object({
    date: zod_1.z.date(),
    source: zod_1.z.nativeEnum(constants_1.Marketing_Source).optional(),
    name: zod_1.z.string().min(1, 'Name field is required'),
    phoneNumber: commonSchema_1.contactNumberSchema,
    altPhoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.NOT_TO_MENTION),
    location: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    assignedTo: commonSchema_1.objectIdSchema, // TODO: need to test this
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).default(constants_1.LeadType.ORANGE),
    remarks: zod_1.z.string().optional(),
    leadTypeModifiedDate: zod_1.z.date().optional(),
    nextDueDate: zod_1.z
        .date()
        .optional()
});
exports.leadRequestSchema = zod_1.z.object({
    date: commonSchema_1.requestDateSchema,
    source: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1, 'Name field is required'),
    phoneNumber: commonSchema_1.contactNumberSchema,
    altPhoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).default(constants_1.Gender.NOT_TO_MENTION),
    location: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    assignedTo: commonSchema_1.objectIdSchema, // TODO: need to test this
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).default(constants_1.LeadType.ORANGE),
    remarks: zod_1.z.string().optional(),
    leadTypeModifiedDate: zod_1.z.date().optional(),
    nextDueDate: commonSchema_1.requestDateSchema
        .optional()
});
exports.updateLeadRequestSchema = zod_1.z.object({
    _id: commonSchema_1.objectIdSchema,
    name: zod_1.z.string().min(1, 'Name field is required').optional(),
    phoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    altPhoneNumber: commonSchema_1.contactNumberSchema
        .optional(),
    email: zod_1.z.string().email('Invalid Email Format').optional(),
    gender: zod_1.z.nativeEnum(constants_1.Gender).optional(),
    location: zod_1.z.nativeEnum(constants_1.Locations).optional(),
    course: zod_1.z.nativeEnum(constants_1.Course).optional(),
    leadType: zod_1.z.nativeEnum(constants_1.LeadType).optional(),
    remarks: zod_1.z.string().optional(),
    nextDueDate: commonSchema_1.requestDateSchema
        .optional()
}).strict(); // strict will restrict extra properties
