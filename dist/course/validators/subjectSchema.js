"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubjectSchema = exports.updateSubjectSchema = exports.createSubjectSchema = exports.subjectSchema = void 0;
const zod_1 = require("zod");
const scheduleSchema_1 = require("./scheduleSchema");
const commonSchema_1 = require("../../validators/commonSchema");
exports.subjectSchema = zod_1.z.object({
    subjectName: zod_1.z.string({ required_error: "Subject Name is required. " }).nonempty("Subject Name is required."),
    subjectCode: zod_1.z.string({ required_error: "Subject Code is required. " }).nonempty("Subject Code is required."),
    instructor: zod_1.z.array(commonSchema_1.objectIdSchema),
    schedule: scheduleSchema_1.scheduleSchema
});
exports.createSubjectSchema = exports.subjectSchema.extend({
    courseId: commonSchema_1.objectIdSchema,
    semesterId: commonSchema_1.objectIdSchema
}).omit({ schedule: true });
exports.updateSubjectSchema = exports.createSubjectSchema.extend({
    subjectId: commonSchema_1.objectIdSchema
});
exports.deleteSubjectSchema = zod_1.z.object({
    courseId: commonSchema_1.objectIdSchema,
    semesterId: commonSchema_1.objectIdSchema,
    subjectId: commonSchema_1.objectIdSchema
});
