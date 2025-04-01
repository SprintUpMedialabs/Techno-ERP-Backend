"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressSchema = void 0;
const zod_1 = require("zod");
// DTODO: shift it to the common => As of now, common mai aur koi folders nahi hai so lets keep this one here as of now.
exports.addressSchema = zod_1.z.object({
    permanentAddress: zod_1.z.string().min(5, 'Permanent address must be at least 5 characters'),
    district: zod_1.z.string(),
    pincode: zod_1.z
        .string()
        .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number starting with a non-zero digit'),
    state: zod_1.z.string(),
    country: zod_1.z.string()
});
