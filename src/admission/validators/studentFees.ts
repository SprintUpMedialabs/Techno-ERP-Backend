import { z } from "zod";
import { FeeStatus, FeeType } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const otherFeesSchema = z.object({
    type: z.nativeEnum(FeeType),
    feeAmount: z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: z.number().min(0, 'Final fees to be paid must be greater than 0'),
    feesDepositedTOA: z.number().min(0, 'Fees to be deposited must be greater then 0').default(0),
    remarks: z.string()
});

export const singleSemSchema = z.object({
    feeAmount: z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: z.number().min(0, 'Final fees to be paid must be Positive')
});

const otherFeesSchemaWithoutFeeAmount = otherFeesSchema.omit({ feeAmount: true });

const singleSemSchemaWithoutFeeAmount = singleSemSchema.omit({ feeAmount: true });


const studentFeesSchema = z.object({
    otherFees: z.array(otherFeesSchema).optional(),
    semWiseFees: z.array(singleSemSchema),
    status: z.nativeEnum(FeeStatus).default(FeeStatus.DRAFT).optional(),
});

export const feesDraftRequestSchema = studentFeesSchema.omit({ status: true }).extend({
    otherFees: z.array(otherFeesSchemaWithoutFeeAmount),
    semWiseFees: z.array(singleSemSchemaWithoutFeeAmount),
    enquiryId: objectIdSchema
});

export const feesDraftUpdateSchema = feesDraftRequestSchema.extend({
    id: objectIdSchema
});


export type IOtherFeesSchema = z.infer<typeof otherFeesSchema>;
export type ISingleSemSchema = z.infer<typeof singleSemSchema>;
export type IFeesDraftRequestSchema = z.infer<typeof feesDraftRequestSchema>;
export type IFeesDraftUpdateSchema = z.infer<typeof feesDraftUpdateSchema>;
export type IStudentFeesSchema = z.infer<typeof studentFeesSchema>;