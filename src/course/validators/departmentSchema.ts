import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const baseDepartmentMetaDataSchema = z.object({
    departmentName: z.string({ required_error: "Department Name is required", }).nonempty("Department Name is required"),
    departmentHOD: z.string({ required_error: "Department HOD Name is required" }).nonempty("Department HOD Name cannot be empty"),
    // startingYear: z.number().refine(val => /^\d{4}$/.test(val.toString()), {
    //     message: "Year must be a valid 4 digit number!"
    // }),
    // endingYear: z.number().optional(),
    departmentHODId : objectIdSchema,
    instructors : z.array(objectIdSchema).optional()
});

export const departmentMetaDataSchema = baseDepartmentMetaDataSchema;

export const departmentMetaDataUpdateSchema = baseDepartmentMetaDataSchema.extend({
    departmentMetaDataID: objectIdSchema,
});

export type IDepartmentMetaDataSchema = z.infer<typeof departmentMetaDataSchema>;
export type IUpdateDepartmentMetaDataSchema = z.infer<typeof departmentMetaDataUpdateSchema>;