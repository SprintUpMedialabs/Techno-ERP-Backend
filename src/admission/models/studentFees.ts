import createHttpError from 'http-errors';
import { model, Schema } from 'mongoose';
import { COLLECTION_NAMES } from '../../config/constants';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { IOtherFeesSchema, ISingleSemSchema, IStudentFeesSchema } from '../validators/studentFees';

export interface IOtherFeesDocument extends IOtherFeesSchema, Document {
    
}

export interface ISingleSemWiseDocument extends ISingleSemSchema, Document {
    
}
export interface IStudentFeesDocument extends IStudentFeesSchema, Document { }

//Other fees schema
export const OtherFeesSchema = new Schema<IOtherFeesDocument>({
    type: {
        type: String,
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
    },
    dueDate:{
        type: Date,
        default: null
    },
    feesPaid:{
        type: Number,
        default: 0
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
        feesClearanceDate: {
            type: Date
        },
        remarks : {
            type : String
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
