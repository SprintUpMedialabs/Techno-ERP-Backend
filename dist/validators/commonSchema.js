"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleSchema = exports.addressSchema = exports.emailSchema = exports.contactNumberSchema = exports.requestDateSchema = exports.objectIdSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const constants_1 = require("../config/constants");
exports.objectIdSchema = zod_1.z.custom((id) => {
    return mongoose_1.default.Types.ObjectId.isValid(id);
}, { message: "Invalid ObjectId" });
exports.requestDateSchema = zod_1.z
    .string()
    .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Date must be in DD/MM/YYYY format');
exports.contactNumberSchema = zod_1.z
    .string()
    .regex(/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890');
// DTODO: make emailSchema uniform
exports.emailSchema = zod_1.z
    .string()
    .email();
exports.addressSchema = zod_1.z.object({
    addressLine1: zod_1.z.string().min(5, 'Permanent address must be at least 5 characters'),
    addressLine2: zod_1.z.string().min(5, 'Permanent address must be at least 5 characters'),
    district: zod_1.z.nativeEnum(constants_1.Districts),
    pincode: zod_1.z
        .string()
        .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number starting with a non-zero digit'),
    state: zod_1.z.nativeEnum(constants_1.StatesOfIndia),
    country: zod_1.z.nativeEnum(constants_1.Countries)
});
exports.roleSchema = zod_1.z.nativeEnum(constants_1.UserRoles);
