import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";

export const departmentSchema = z.object({
    departmentName: z.string().min(3).max(50, "Department name should be between 3 and 50 characters"),
    hod: objectIdSchema,
});

export const departmentUpdateSchema = departmentSchema.extend({
    departmentId : objectIdSchema
}).omit({ departmentName : true});      //Name of department cannot be updated

export type IDepartmentSchema = z.infer<typeof departmentSchema>;
export type IDepartmentUpdateSchema = z.infer<typeof departmentUpdateSchema>;