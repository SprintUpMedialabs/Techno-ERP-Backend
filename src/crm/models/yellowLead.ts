import mongoose, { Document, Schema } from 'mongoose';
import { IYellowLead } from '../validators/yellowLead';
import { Gender, FinalConversionType } from '../../config/constants';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import createHttpError from 'http-errors';
import logger from '../../config/logger';

export interface IYellowLeadDocument extends IYellowLead, Document { }

const yellowLeadSchema = new Schema<IYellowLeadDocument>(
  {
    date: {
      type: Date,
      required: [true, 'Lead Type Change Date is required'],
      $set: (value: string) => convertToMongoDate(value)
    },
    name: { type: String, required: [true, 'Name is required'] },
    phoneNumber: {
      type: String,
      required: [true, 'Phone no is required'],
      unique: [true, 'Phone no already exists'],
      match: [/^\d{10}$/, 'Invalid phone number format, expected: 10 digits']
    },
    altPhoneNumber: {
      type: String,
      match: [/^\d{10}$/, 'Invalid phone number format, expected: 10 digits']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email already exists'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    gender: { type: String, enum: Object.values(Gender), default: Gender.NOT_TO_MENTION },
    assignedTo: { type: Schema.Types.ObjectId, required: [true, 'Assigned To Field is required'] },
    location: { type: String },
    course: { type: String },
    campusVisit: { type: Boolean, default: false },
    nextDueDate: {
      type: Date,
      set: (value: string) => {
        return convertToMongoDate(value);
      }
    },
    finalConversion: { type: String, enum: Object.values(FinalConversionType) },
    remarks: { type: String }
  },
  { timestamps: true }
);

const handleMongooseError = (error: any, next: Function) => {
  logger.error(error);
  if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else if (error.name == 'MongooseError') {
    throw createHttpError(400, `${error.message}`);
  } else {
    next(error);
  }
};

yellowLeadSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});
yellowLeadSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});
yellowLeadSchema.post('findOne', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});


const transformDates = (_: any, ret: any) => {
  logger.debug("we are here");
  ['nextDueDate', 'date', 'createdAt'].forEach((key) => {
    if (ret[key]) {
      if (key == 'createdAt') {
        ret['ltcDate'] = convertToDDMMYYYY(ret[key]);
      } else {
        ret[key] = convertToDDMMYYYY(ret[key]);
      }
    }
  });
  return ret;
};

yellowLeadSchema.set('toJSON', { transform: transformDates });
yellowLeadSchema.set('toObject', { transform: transformDates });


export const YellowLead = mongoose.model<IYellowLeadDocument>('YellowLead', yellowLeadSchema);
