"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectDetailsUpdateSchema = exports.subjectDetailsRequestSchema = exports.subjectDetailsSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.subjectDetailsSchema = zod_1.z.object({
    subjectName: zod_1.z.string().min(3).max(100, "Subject name should be between 3 to 100 characters"),
    instructor: commonSchema_1.objectIdSchema,
    subjectCode: zod_1.z.string().min(3).max(10, "Subject code should be between 3 to 10 characters"),
});
exports.subjectDetailsRequestSchema = exports.subjectDetailsSchema.extend({
    semesterId: commonSchema_1.objectIdSchema
});
exports.subjectDetailsUpdateSchema = exports.subjectDetailsSchema.extend({
    subjectId: commonSchema_1.objectIdSchema
});
