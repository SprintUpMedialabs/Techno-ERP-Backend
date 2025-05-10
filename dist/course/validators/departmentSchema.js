"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentMetaDataUpdateSchema = exports.departmentMetaDataSchema = exports.baseDepartmentMetaDataSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.baseDepartmentMetaDataSchema = zod_1.z.object({
    departmentName: zod_1.z.string({ required_error: "Department Name is required", }).nonempty("Department Name is required"),
    departmentHOD: zod_1.z.string({ required_error: "Department HOD Name is required" }).nonempty("Department HOD Name cannot be empty"),
    departmentHODId: commonSchema_1.objectIdSchema,
    instructors: zod_1.z.array(commonSchema_1.objectIdSchema).optional()
});
exports.departmentMetaDataSchema = exports.baseDepartmentMetaDataSchema;
exports.departmentMetaDataUpdateSchema = exports.baseDepartmentMetaDataSchema.extend({
    departmentMetaDataID: commonSchema_1.objectIdSchema,
});
