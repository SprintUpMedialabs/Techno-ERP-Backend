import { z } from "zod";
import { FeeActions, TransactionTypes } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const CollegeTransactionSchema = z.object({
    studentId : z.string(),
    dateTime : z.date().default(new Date()).optional(),
    feeAction : z.nativeEnum(FeeActions),
    transactionID : z.number().optional(),
    amount : z.number(),
    txnType : z.nativeEnum(TransactionTypes),
    remark : z.string().optional(),
    actionedBy : objectIdSchema.optional(),
    courseName : z.string().optional(),
    courseCode : z.string().optional(),
    courseYear : z.string().optional()
})

export const CreateCollegeTransactionSchema = CollegeTransactionSchema;

export type ICollegeTransactionSchema = z.infer<typeof CollegeTransactionSchema>;
export type ICreateCollegeTransactionSchema = z.infer<typeof CreateCollegeTransactionSchema>;