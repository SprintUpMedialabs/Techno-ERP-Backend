import { z } from "zod";
import { FeeActions } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const CollegeTransactionSchema = z.object({
    studentId : objectIdSchema,
    dateTime : z.string().datetime(),
    feeAction : z.nativeEnum(FeeActions),
    amount : z.string(),
    txnType : z.string(),
    remark : z.string()
})

export type ICollegeTransactionSchema = z.infer<typeof CollegeTransactionSchema>;