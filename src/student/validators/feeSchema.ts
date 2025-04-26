import { z } from "zod";
import { requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { FeeTypes } from "../../config/constants";

export const baseFeeSchema = z.object({
    type : z.nativeEnum(FeeTypes),
    actualFee : z.number(),
    finalFee : z.number(),
    remark : z.string(),
    date : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
})

export const FeeSchema = z.object({
    details : z.array(baseFeeSchema),
    dueDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
    paidAmount : z.number(),
    totalActualFee : z.number()
})


export type IFeeSchema = z.infer<typeof FeeSchema>;