import { z } from "zod";
import { FeeActions } from "../../config/constants";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export const CollegeTransactionSchema = z.object({
    studentId : z.string(),
    dateTime : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
    feeAction : z.nativeEnum(FeeActions),
    transactionID : z.number(),
    amount : z.string(),
    txnType : z.string(),
    remark : z.string()
})

export type ICollegeTransactionSchema = z.infer<typeof CollegeTransactionSchema>;