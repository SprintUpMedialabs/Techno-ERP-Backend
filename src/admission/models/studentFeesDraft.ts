import createHttpError from 'http-errors';
import { model, Schema } from 'mongoose';
import { COLLECTION_NAMES } from '../../config/constants';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { IStudentFeesSchema } from '../validators/studentFees';
import { OtherFeesSchema, SingleSemWiseFeesSchema } from './studentFees';

export interface IStudentFeesDocument extends IStudentFeesSchema, Document { }


const StudentFeesDraftSchema = new Schema<IStudentFeesDocument>(
  {
    otherFees: {
      type: [OtherFeesSchema],
      validate: [
        (value: any[]) => value.length <= 50,
        'Cannot have more than 50 fee entries'
      ],
      required: false
    },
    semWiseFees: {
      type: [SingleSemWiseFeesSchema],
      required: false
    },
    feesClearanceDate: {
      type: Date,
      required: false
    },
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

StudentFeesDraftSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

StudentFeesDraftSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
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

StudentFeesDraftSchema.set('toJSON', { transform: transformDates });
StudentFeesDraftSchema.set('toObject', { transform: transformDates });

export const StudentFeesDraftModel = model(COLLECTION_NAMES.STUDENT_FEE_DRAFT, StudentFeesDraftSchema);
