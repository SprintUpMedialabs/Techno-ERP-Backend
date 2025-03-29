import { model, Schema } from 'mongoose';
import { FeeStatus, FeeType } from '../../config/constants';
import { IOtherFeesSchema, ISingleSemSchema, IStudentFeesSchema } from '../validators/studentFees';
import createHttpError from 'http-errors';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';

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
    remarks: {
        type: String
    }
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
        feesClearanceDate : {
            type : Date
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
    return ret;
  };
  
export const FeesDraftModel = model('studentFee', StudentFeesSchema);
