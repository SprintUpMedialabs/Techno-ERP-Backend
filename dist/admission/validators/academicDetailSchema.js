"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicDetailsArraySchema = exports.academicDetailSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.academicDetailSchema = zod_1.z.object({
    educationLevel: zod_1.z.nativeEnum(constants_1.EducationLevel), // Only allows fixed values
    schoolCollegeName: zod_1.z.string().min(1, 'School/College Name is required'),
    universityBoardName: zod_1.z.string().min(1, 'University/Board Name is required'),
    passingYear: zod_1.z
        .number()
        .int()
        .refine((year) => year.toString().length === 4, {
        message: 'Passing Year must be a valid 4-digit year'
    }),
    percentageObtained: zod_1.z
        .number()
        .min(0, 'Percentage must be at least 0')
        .max(100, 'Percentage cannot exceed 100'),
    subjects: zod_1.z.string().optional(),
});
// Array schema
exports.academicDetailsArraySchema = zod_1.z.array(exports.academicDetailSchema);
