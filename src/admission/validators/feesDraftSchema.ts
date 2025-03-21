import { z } from "zod";
import { FeeStatus, TypeOfFee } from "../../config/constants";

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


export const feesDraftSchema = z.object({
    // studentId : objectIdSchema,
    otherFees : z.array(otherFeesSchema),
    semWiseFees : semWiseSchema,
    status : z.nativeEnum(FeeStatus).default(FeeStatus.DRAFT).optional()
});


export type IOtherFeesSchema = z.infer<typeof otherFeesSchema>;
export type ISingleSemSchema = z.infer<typeof singleSemSchema>;
export type ISemWiseSchema = z.infer<typeof semWiseSchema>;
export type IFeesDraftSchema = z.infer<typeof feesDraftSchema>;