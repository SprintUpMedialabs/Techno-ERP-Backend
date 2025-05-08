import { z } from "zod";
import { FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";

export const FeeUpdateHistorySchema = z.object({
    updatedAt : z.date(),
    updatedFee : z.number()
});

export const BaseFeeSchema = z.object({
    type : z.nativeEnum(FinanceFeeType),
    schedule: z.nativeEnum(FinanceFeeSchedule),
    actualFee : z.number(),
    finalFee : z.number(),
    paidAmount : z.number(),
    remark : z.string(),
    feeUpdateHistory : z.array(FeeUpdateHistorySchema)
})

export const FeeSchema = z.object({
    details : z.array(BaseFeeSchema),
    dueDate: z.union([z.date(), z.undefined()]),
    paidAmount : z.number(),
    totalFinalFee : z.number(),
});

export const FetchFeeHistorySchema = z.object({
    studentId : objectIdSchema,
    semesterId : objectIdSchema,
    detailId : objectIdSchema
});

export const EditFeeBreakUpSchema = z.object({
    studentId : objectIdSchema,
    semesterId : objectIdSchema,
    detailId : objectIdSchema,
    amount : z.number()
})

export type IBaseFeeSchema = z.infer<typeof BaseFeeSchema>;
export type IFeeSchema = z.infer<typeof FeeSchema>;
export type IFeeUpdateHistorySchema = z.infer<typeof FeeUpdateHistorySchema>;
export type IFetchFeeHistorySchema = z.infer<typeof FetchFeeHistorySchema>;
export type IEditFeeBreakUpSchema = z.infer<typeof EditFeeBreakUpSchema>;