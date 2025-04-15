"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterRequestSchema = exports.semesterSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.semesterSchema = zod_1.z.object({
    semesterNumber: zod_1.z.number().min(1).max(10, "Semester number should be between 1 and 10"),
});
exports.semesterRequestSchema = exports.semesterSchema.extend({
    courseId: commonSchema_1.objectIdSchema
});
