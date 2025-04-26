"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentMetaDataUpdateSchema = exports.departmentMetaDataSchema = exports.baseDepartmentMetaDataSchema = void 0;
const zod_1 = require("zod");
const commonSchema_1 = require("../../validators/commonSchema");
exports.baseDepartmentMetaDataSchema = zod_1.z.object({
    departmentName: zod_1.z.string({ required_error: "Department Name is required", }).nonempty("Department Name is required"),
    departmentHOD: zod_1.z.string({ required_error: "Department HOD Name is required" }).nonempty("Department HOD Name cannot be empty"),
    startingYear: zod_1.z.number().refine(val => /^\d{4}$/.test(val.toString()), {
        message: "Year must be a valid 4 digit number!"
    }),
    endingYear: zod_1.z.number().optional(),
    instructors: zod_1.z.array(commonSchema_1.objectIdSchema)
});
exports.departmentMetaDataSchema = exports.baseDepartmentMetaDataSchema.superRefine(({ startingYear, endingYear }, ctx) => {
    if (!endingYear)
        return true;
    const isFourDigit = /^\d{4}$/.test(endingYear.toString());
    const isValidYear = startingYear <= endingYear;
    if (!isFourDigit) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be a 4-digit number",
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
    if (!isValidYear) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be greater than starting year",
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
});
exports.departmentMetaDataUpdateSchema = exports.baseDepartmentMetaDataSchema.extend({
    departmentMetaDataID: commonSchema_1.objectIdSchema,
}).superRefine(({ startingYear, endingYear }, ctx) => {
    if (!endingYear)
        return true;
    const isFourDigit = /^\d{4}$/.test(endingYear.toString());
    const isValidYear = startingYear <= endingYear;
    if (!isFourDigit) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be a 4-digit number",
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
    if (!isValidYear) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be greater than starting year",
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
});
