import { z } from "zod";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { FeeActions, TransactionTypes } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export const BaseTransactionSchema = z.object({
    transactionID : z.number(),
    dateTime : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(), 
    feeAction : z.nativeEnum(FeeActions),
    amount : z.number(),
    txnType : z.nativeEnum(TransactionTypes),
    remark : z.string().optional()
})

export const StudentTransactionSchema = z.object({
    studentId : z.string(),
    transactions : z.array(BaseTransactionSchema)
})

export type IBaseTransactionSchema = z.infer<typeof BaseTransactionSchema>;
export type IStudentTransactionSchema = z.infer<typeof StudentTransactionSchema>;