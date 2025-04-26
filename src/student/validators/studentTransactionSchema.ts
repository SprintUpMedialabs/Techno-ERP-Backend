import { z } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
import { FeeActions } from "../../config/constants";

export const baseTransactionSchema = z.object({
    dateTime : z.string().datetime(), 
    feeAction : z.nativeEnum(FeeActions),
    amount : z.number(),
    txnType : z.number(),
    remark : z.string()
})

export const StudentTransactionSchema = z.object({
    studentId : objectIdSchema,
    transactions : z.array(baseTransactionSchema)
})

export type IStudentTransactionSchema = z.infer<typeof StudentTransactionSchema>;