"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = void 0;
const zod_1 = require("zod");
exports.verifyOtpSchema = zod_1.z.object({
    verifyOtp: zod_1.z.number(),
    verifyOtpExpireAt: zod_1.z.date(),
    email: zod_1.z.string().email()
});
