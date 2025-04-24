import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const baseDepartmentMetaDataSchema = z.object({
    departmentName: z.string({ required_error: "Department Name is required", }).nonempty("Department Name is required"),
    departmentHOD: z.string({ required_error: "Department HOD Name is required" }).nonempty("Department HOD Name cannot be empty"),
    startingYear: z.number().refine(val => /^\d{4}$/.test(val.toString()), {
        message: "Year must be a valid 4 digit number!"
    }),
    endingYear: z.number().optional(),
    instructors : z.array(objectIdSchema).optional()
})

export const departmentMetaDataSchema = baseDepartmentMetaDataSchema.superRefine(({ startingYear, endingYear }, ctx) => {

    if (!endingYear)
        return true;

    const isFourDigit = /^\d{4}$/.test(endingYear.toString());
    const isValidYear = startingYear <= endingYear;

    if (!isFourDigit) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be a 4-digit number",
            code: z.ZodIssueCode.custom,
        });
    }

    if (!isValidYear) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be greater than starting year",
            code: z.ZodIssueCode.custom,
        });
    }
});

export const departmentMetaDataUpdateSchema = baseDepartmentMetaDataSchema.extend({
    departmentMetaDataID: objectIdSchema,
}).superRefine(({ startingYear, endingYear }, ctx) => {

    if (!endingYear)
        return true;
    
    const isFourDigit = /^\d{4}$/.test(endingYear.toString());
    const isValidYear = startingYear <= endingYear;
    if (!isFourDigit) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be a 4-digit number",
            code: z.ZodIssueCode.custom,
        });
    }

    if (!isValidYear) {
        ctx.addIssue({
            path: ['endingYear'],
            message: "Ending year must be greater than starting year",
            code: z.ZodIssueCode.custom,
        });
    }
});

export type IDepartmentMetaDataSchema = z.infer<typeof departmentMetaDataSchema>;
export type IUpdateDepartmentMetaDataSchema = z.infer<typeof departmentMetaDataUpdateSchema>;