"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRequestSchema = void 0;
const zod_1 = require("zod");
exports.loginRequestSchema = zod_1.z.object({
    universityId: zod_1.z.string(),
    password: zod_1.z
        .string()
        .regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, 'Password must be in XX/XX/XXXX format'),
});
