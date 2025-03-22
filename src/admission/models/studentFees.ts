import { model, Schema } from 'mongoose';
import { FeeStatus, FeeType } from '../../config/constants';
import { IOtherFeesSchema, ISingleSemSchema, IStudentFeesSchema } from '../validators/studentFees';

export interface IOtherFeesDocument extends IOtherFeesSchema, Document {
    feeAmount: number
}

export interface ISingleSemWiseDocument extends ISingleSemSchema, Document {
    feeAmount: number
}
export interface IStudentFeesDocument extends IStudentFeesSchema, Document { }

//Other fees schema
const OtherFeesSchema = new Schema<IOtherFeesDocument>({
    type: {
        type: String,
        enum: Object.values(FeeType),
        required: true
    },
    feeAmount: {
        type: Number,
        required: true
    },
    finalFee: {
        type: Number,
        required: true
    },
    feesDepositedTOA: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String
    }
});

//Sem wise schema
const SingleSemWiseFeesSchema = new Schema<ISingleSemWiseDocument>({
    feeAmount: {
        type: Number,
        required: true
    },
    finalFee: {
        type: Number,
        required: true
    }
}, { _id: false });


//Fees draft for entire student
const StudentFeesSchema = new Schema<IStudentFeesDocument>(
    {
        otherFees: {
            type: [OtherFeesSchema],
            validate: [
                (value: any[]) => value.length <= 50,
                'Cannot have more than 50 fee entries'
            ]
        },
        semWiseFees: {
            type: [SingleSemWiseFeesSchema],
        },
        feeStatus: {
            type: String,
            enum: Object.values(FeeStatus),
            default: FeeStatus.DRAFT,
            optional: true
        }
    },
    { timestamps: true }
);

export const FeesDraftModel = model('studentFee', StudentFeesSchema);
