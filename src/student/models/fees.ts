import { Schema } from "mongoose";
import { FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { IBaseFeeSchema, IFeeSchema } from "../validators/feeSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export interface IBaseFeeDocument extends IBaseFeeSchema, Document{}
export interface IFeeDocument extends IFeeSchema, Document{}

const BaseFeeModel = new Schema<IBaseFeeDocument>({
    type: { 
        type: String, 
        enum: Object.values(FinanceFeeType), 
        required: true 
    },
    schedule: { 
        type: String, 
        enum: Object.values(FinanceFeeSchedule), 
        required: true 
    },
    actualFee: { 
        type: Number, 
        required: true 
    },
    finalFee: { 
        type: Number, 
        required: true 
    },
    paidAmount: { 
        type: Number, 
        required: true 
    },
    remark: { 
        type: String, 
    },
    dueDate: { 
        type: Date,
        set: (value : Date|undefined) => value ? convertToMongoDate(value) : undefined
    }
});

export const FeeModel = new Schema<IFeeDocument>({
    details: {
        type: [BaseFeeModel],
        required: true,
        default: []
    },
    dueDate: {
        type: Date,
        set: (value : Date|undefined) => value ? convertToMongoDate(value) : undefined
    },
    paidAmount: {
        type: Number,
        required: true
    },
    totalFinalFee: {
        type: Number,
        required: true
    }
});

