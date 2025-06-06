"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicDetailsArraySchema = exports.academicDetailSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.academicDetailSchema = zod_1.z.object({
    educationLevel: zod_1.z.nativeEnum(constants_1.EducationLevel), // Only allows fixed values
    schoolCollegeName: zod_1.z.string().optional(),
    universityBoardName: zod_1.z.string().optional(),
    passingYear: zod_1.z
        .number()
        .int()
        .refine((year) => year.toString().length === 4, {
        message: 'Passing Year must be a valid 4-digit year'
    }).optional(),
    percentageObtained: zod_1.z
        .number()
        .min(0, 'Percentage must be at least 0')
        .max(100, 'Percentage cannot exceed 100')
        .optional(),
    subjects: zod_1.z.string().optional(),
});
// Array schema
exports.academicDetailsArraySchema = zod_1.z.array(exports.academicDetailSchema);
