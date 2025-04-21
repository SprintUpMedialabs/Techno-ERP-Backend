"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentFilterSchema = void 0;
const zod_1 = require("zod");
exports.studentFilterSchema = zod_1.z.object({
    course: zod_1.z.string().optional(),
    semester: zod_1.z.number().min(1, 'Invalid Semester').max(12, 'Invalid Semester').optional(),
    academicYear: zod_1.z.string().regex(/^\d{4}-\d{4}$/, 'Invalid Academic Year').optional(),
    search: zod_1.z.string().optional()
});
