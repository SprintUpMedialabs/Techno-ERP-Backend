import mongoose, { model, Schema, Types } from 'mongoose';
import { COLLECTION_NAMES, FeeStatus, FeeType } from '../../config/constants';
import { IOtherFeesSchema, ISingleSemSchema, IStudentFeesSchema } from '../validators/studentFees';
import createHttpError from 'http-errors';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { emailSchema } from '../../validators/commonSchema';

export interface IOtherFeesDocument extends IOtherFeesSchema, Document {
    feeAmount: number
}

export interface ISingleSemWiseDocument extends ISingleSemSchema, Document {
    feeAmount: number
}
export interface IStudentFeesDocument extends IStudentFeesSchema, Document { }

//Other fees schema
export const OtherFeesSchema = new Schema<IOtherFeesDocument>({
    type: {
        type: String,
        enum: Object.values(FeeType),
    },
    feeAmount: {
        type: Number,
    },
    finalFee: {
        type: Number,
    },
    feesDepositedTOA: {
        type: Number,
        default: 0
    },
});

//Sem wise schema
export const SingleSemWiseFeesSchema = new Schema<ISingleSemWiseDocument>({
    feeAmount: {
        type: Number,
    },
    finalFee: {
        type: Number,
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
        },
        feesClearanceDate: {
            type: Date
        },
        counsellor: {
            type: [Schema.Types.Mixed], // Allows ObjectId or String
            validate: {
                validator: function (values) {
                    if (!Array.isArray(values)) return false; // Ensure it's an array
            
                    return values.every(value => {
                        // Allow null or undefined
                        if (value === null || value === undefined) return true;
            
                        // Check for valid ObjectId
                        const isObjectId = mongoose.Types.ObjectId.isValid(value);
            
                        // Allow string 'other'
                        const isOther = value === 'other';
            
                        return isObjectId || isOther;
                    });
                },
                message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'other')`
            },
            required: true,
        },
        telecaller: {
            type: [Schema.Types.Mixed], // Allows ObjectId or String
            validate: {
                validator: function (values) {
                    if (!Array.isArray(values)) return false; // Ensure it's an array
            
                    return values.every(value => {
                        // Allow null or undefined
                        if (value === null || value === undefined) return true;
            
                        // Check for valid ObjectId
                        const isObjectId = mongoose.Types.ObjectId.isValid(value);
            
                        // Allow string 'other'
                        const isOther = value === 'other';
            
                        return isObjectId || isOther;
                    });
                },
                message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'other')`
            },
            required: true,
        }
    },
    { timestamps: true }
);


const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    } else if (error.name == 'MongooseError') {
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error); // Pass any other errors to the next middleware
    }
};

StudentFeesSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

StudentFeesSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    ['feesClearanceDate'].forEach((key) => {
        if (ret[key]) {
            ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

StudentFeesSchema.set('toJSON', { transform: transformDates });
StudentFeesSchema.set('toObject', { transform: transformDates });

export const StudentFeesModel = model(COLLECTION_NAMES.STUDENT_FEE, StudentFeesSchema);
