import { z } from "zod";
import { requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { FeeStatuses, FeeType, FinanceFeeSchedule, FinanceFeeType, Schedule } from "../../config/constants";

export const BaseFeeSchema = z.object({
    type : z.nativeEnum(FinanceFeeType),
    schedule: z.nativeEnum(FinanceFeeSchedule),
    actualFee : z.number(),
    finalFee : z.number(),
    paidAmount : z.number(),
    remark : z.string(),
    dueDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
})

export const FeeSchema = z.object({
    details : z.array(BaseFeeSchema),
    dueDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
    paidAmount : z.number(),
    totalFinalFee : z.number(),
});

export type IBaseFeeSchema = z.infer<typeof BaseFeeSchema>;
export type IFeeSchema = z.infer<typeof FeeSchema>;