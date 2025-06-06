import { z } from "zod";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { objectIdSchema, requestDateSchema } from "../../validators/commonSchema";
import { AdmissionReference } from "../../config/constants";

export const otherFeesSchema = z.object({
    type: z.string(),
    feeAmount: z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: z.number().min(0, 'Final fees to be paid must be greater than 0'),
    feesDepositedTOA: z.number().min(0, 'Fees to be deposited must be greater then 0').default(0),
});

export const singleSemSchema = z.object({
    feeAmount: z.number().min(0, 'Fee amount must be greater than 0'),
    finalFee: z.number().min(0, 'Final fees to be paid must be Positive'),
    dueDate: z.date().optional(),
    feesPaid: z.number().min(0, 'Fees paid must be greater than 0').optional().default(0),
});

const otherFeesSchemaWithoutFeeAmount = otherFeesSchema.omit({ feeAmount: true });

const singleSemSchemaWithoutFeeAmount = singleSemSchema.omit({ feeAmount: true, dueDate: true, feesPaid: true });


const studentFeesSchema = z.object({
    otherFees: z.array(otherFeesSchema).optional(),
    semWiseFees: z.array(singleSemSchema),
    feesClearanceDate: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
    remarks: z.string().optional(),
    isFeeApplicable : z.boolean().default(true)
});

export const feesRequestSchema = studentFeesSchema.extend({
    otherFees: z.array(otherFeesSchemaWithoutFeeAmount),
    semWiseFees: z.array(singleSemSchemaWithoutFeeAmount),
    enquiryId: objectIdSchema,
    feesClearanceDate: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ),
    references: z.array(z.nativeEnum(AdmissionReference)).optional(),
    srAmount: z.number().optional(),
    counsellor: z.array(z.string()).optional(),
    telecaller: z.array(z.string()).optional(),
}).strict();

export const feesUpdateSchema = feesRequestSchema.extend({
    id: objectIdSchema,
}).omit({ enquiryId: true }).strict();


export const feesDraftRequestSchema = feesRequestSchema.extend({
    otherFees: z.array(otherFeesSchema.partial()).optional(),
    semWiseFees: z.array(singleSemSchema.partial()).optional(),
    feesClearanceDate: requestDateSchema.transform((date) =>
        convertToMongoDate(date) as Date
    ).optional(),
}).strict();


export const feesDraftUpdateSchema = feesDraftRequestSchema.extend({
    id: objectIdSchema,
}).strict();


export type IOtherFeesSchema = z.infer<typeof otherFeesSchema>;
export type ISingleSemSchema = z.infer<typeof singleSemSchema>;
export type IFeesRequestSchema = z.infer<typeof feesRequestSchema>;
export type IFeesUpdateSchema = z.infer<typeof feesUpdateSchema>;
export type IStudentFeesSchema = z.infer<typeof studentFeesSchema>;
export type IFeesDraftRequestSchema = z.infer<typeof feesDraftRequestSchema>;
export type IFeesDraftUpdateSchema = z.infer<typeof feesDraftUpdateSchema>;
