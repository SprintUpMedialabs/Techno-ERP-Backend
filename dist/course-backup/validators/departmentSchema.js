"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentUpdateSchema = exports.departmentSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.departmentSchema = zod_1.z.object({
    departmentName: zod_1.z.string().min(3).max(50, "Department name should be between 3 and 50 characters"),
    hod: commonSchema_1.objectIdSchema,
});
exports.departmentUpdateSchema = exports.departmentSchema.extend({
    departmentId: commonSchema_1.objectIdSchema
}).omit({ departmentName: true }); //Name of department cannot be updated
