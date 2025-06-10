"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailSchema = exports.updatePasswordRequestSchema = exports.forgotPasswordRequestSchema = exports.loginRequestSchema = exports.OTPRequestSchema = exports.registerationRequestSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.registerationRequestSchema = zod_1.z.object({
    firstName: zod_1.z.string().regex(/^[A-Za-z]+$/, { message: 'First name must contain only alphabets' }),
    lastName: zod_1.z.string().regex(/^[A-Za-z]+$/, { message: 'Last name must contain only alphabets' }),
    roles: zod_1.z
        .array(zod_1.z.nativeEnum(constants_1.UserRoles), { message: 'Invalid role specified' })
        .default([constants_1.UserRoles.BASIC_USER]),
    token: zod_1.z.string({ message: 'Token is required' })
});
exports.OTPRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    otp: zod_1.z.number().min(100000).max(999999)
});
exports.loginRequestSchema = zod_1.z.object({
    email: zod_1.z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' }),
    password: zod_1.z.string({ message: 'Password is required' })
});
exports.forgotPasswordRequestSchema = zod_1.z.object({
    email: zod_1.z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' })
});
exports.updatePasswordRequestSchema = zod_1.z.object({
    password: zod_1.z.string({ message: 'Password is required' })
});
exports.emailSchema = zod_1.z.object({
    email: zod_1.z.string({ message: 'Email is required' }).email({ message: 'Invalid email format' })
});
