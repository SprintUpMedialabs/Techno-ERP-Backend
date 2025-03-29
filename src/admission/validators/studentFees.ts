import { z } from "zod";
import { FeeStatus, FeeType } from "../../config/constants";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

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
    feeStatus: z.nativeEnum(FeeStatus).default(FeeStatus.DRAFT).optional(),
    feesClearanceDate : requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    )
});

export const feesRequestSchema = studentFeesSchema.omit({ feeStatus: true }).extend({
    otherFees: z.array(otherFeesSchemaWithoutFeeAmount),
    semWiseFees: z.array(singleSemSchemaWithoutFeeAmount),
    enquiryId: objectIdSchema,
    draftId : objectIdSchema
});

export const feesUpdateSchema = feesRequestSchema.extend({
    id: objectIdSchema
}).omit({draftId : true});

export const feesDraftRequestSchema = feesRequestSchema.extend({
    otherFees: z.array(otherFeesSchema.partial()).optional(),
    semWiseFees: z.array(singleSemSchema.partial()).optional(),
    enquiryId : objectIdSchema
}).omit({ draftId : true}).partial().strict();

export const feesDraftUpdateSchema = feesDraftRequestSchema.extend({
    draftId : objectIdSchema
}).omit({ enquiryId : true}).partial().strict()

export type IOtherFeesSchema = z.infer<typeof otherFeesSchema>;
export type ISingleSemSchema = z.infer<typeof singleSemSchema>;
export type IFeesRequestSchema = z.infer<typeof feesRequestSchema>;
export type IFeesUpdateSchema = z.infer<typeof feesUpdateSchema>;
export type IStudentFeesSchema = z.infer<typeof studentFeesSchema>;
export type IFeesDraftRequestSchema = z.infer<typeof feesDraftRequestSchema>;
export type IFeesDraftUpdateSchema = z.infer<typeof feesDraftUpdateSchema>;
