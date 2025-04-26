"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previousCollegeDataSchema = void 0;
const zod_1 = require("zod");
exports.previousCollegeDataSchema = zod_1.z.object({
    collegeName: zod_1.z.string().min(3, 'College Name must be at least 3 characters').optional(),
    district: zod_1.z.string().optional(),
    boardUniversity: zod_1.z.string().optional(),
    passingYear: zod_1.z
        .number()
        .int()
        .refine((year) => year.toString().length === 4, {
        message: 'Passing Year must be a valid 4-digit year'
    }),
    aggregatePercentage: zod_1.z
        .number()
        .min(0, 'Percentage must be at least 0')
        .max(100, 'Percentage cannot exceed 100')
});
