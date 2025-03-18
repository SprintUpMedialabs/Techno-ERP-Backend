import { z } from "zod";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export const transactionHistorySchema = z.object({
    studentId: objectIdSchema,
    otp: z.number().min(100000).max(999999),
    date: requestDateSchema.transform((date) => convertToMongoDate(date) as Date),
    amountPaid: z.number().positive("Amount must be non-negative"),
    remarks: z.string().optional()
});


export type ITransactionHistorySchema = z.infer<typeof transactionHistorySchema>;