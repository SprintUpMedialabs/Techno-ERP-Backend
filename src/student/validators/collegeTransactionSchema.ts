import { z } from "zod";
import { FeeActions, TransactionTypes } from "../../config/constants";

export const CollegeTransactionSchema = z.object({
    studentId : z.string(),
    dateTime : z.date().default(new Date()).optional(),
    feeAction : z.nativeEnum(FeeActions),
    transactionID : z.number().optional(),
    amount : z.number(),
    txnType : z.nativeEnum(TransactionTypes),
    remark : z.string().optional()
})

export const CreateCollegeTransactionSchema = CollegeTransactionSchema;

export type ICollegeTransactionSchema = z.infer<typeof CollegeTransactionSchema>;
export type ICreateCollegeTransactionSchema = z.infer<typeof CreateCollegeTransactionSchema>;