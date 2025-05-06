import { Schema } from "mongoose";
import { FinanceFeeSchedule, FinanceFeeType } from "../../config/constants";
import { IBaseFeeSchema, IFeeSchema, IFeeUpdateHistorySchema } from "../validators/feeSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export interface IBaseFeeDocument extends IBaseFeeSchema, Document{}
export interface IFeeDocument extends IFeeSchema, Document{}
export interface IFeeUpdateHistoryDocument extends IFeeUpdateHistorySchema, Document{}

const FeeUpdateHistoryModel = new Schema <IFeeUpdateHistoryDocument>({
    updatedAt : {
        type : Date
    },
    updatedFee : {
        type : Number
    }
})

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
    feeUpdateHistory : [FeeUpdateHistoryModel]
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

