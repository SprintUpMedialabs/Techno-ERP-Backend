"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleSchema = exports.emailSchema = exports.contactNumberSchema = exports.requestDateSchema = exports.objectIdSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const constants_1 = require("../config/constants");
exports.objectIdSchema = zod_1.z.custom((id) => mongoose_1.default.Types.ObjectId.isValid(id), { message: "Invalid ObjectId" });
exports.requestDateSchema = zod_1.z
    .string()
    .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Date must be in DD/MM/YYYY format');
// DTODO: update regex => Resolved
exports.contactNumberSchema = zod_1.z
    .string()
    .regex(/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890');
// DTODO: make emailSchema uniform
exports.emailSchema = zod_1.z
    .string()
    .email();
exports.roleSchema = zod_1.z.nativeEnum(constants_1.UserRoles);
