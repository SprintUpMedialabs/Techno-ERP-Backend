import { z } from "zod";
import { FeeStatus, TypeOfFee } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";

export const otherFeesSchema = z.object({
    type : z.nativeEnum(TypeOfFee),
    // DTODO: this will be read from the metadata
    feeAmount : z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee : z.number().min(0, 'Final fees to be paid must be greater than 0'),
    feesDepositedTOA : z.number().min(0, 'Fees to be deposited must be greater then 0').default(0),
    remarks : z.string()
});

export const singleSemSchema = z.object({
    // DTODO: this will be read from the metadata
    feeAmount: z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: z.number().min(0, 'Final fees to be paid must be greater than 0')
});

//This will accept key to be as sem_1, sem_2, sem_3, etc.
export const semWiseSchema = z.record(z.string().regex(/^sem_\d+$/, 'Semester key must be in the format "sem_X"'), singleSemSchema);

const baseFeesDraftSchema = z.object({
    otherFees: z.array(otherFeesSchema).optional(),
    semWiseFees: semWiseSchema.optional(),
    status: z.nativeEnum(FeeStatus).default(FeeStatus.DRAFT).optional(),
});

export const feesDraftRequestSchema = baseFeesDraftSchema.extend({
    enquiryId: objectIdSchema
});

export const feesDraftUpdateSchema = baseFeesDraftSchema.extend({
    feesDraftId: objectIdSchema
});


export type IOtherFeesSchema = z.infer<typeof otherFeesSchema>;
export type ISingleSemSchema = z.infer<typeof singleSemSchema>;
export type ISemWiseSchema = z.infer<typeof semWiseSchema>;
export type IFeesDraftRequestSchema = z.infer<typeof feesDraftRequestSchema>;
export type IFeesDraftUpdateSchema = z.infer<typeof feesDraftUpdateSchema>;