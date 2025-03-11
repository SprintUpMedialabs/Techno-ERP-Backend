import mongoose, { Document, Schema } from 'mongoose';
import { IYellowLead } from '../validators/yellowLead';
import { Gender, FinalConversionType } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import createHttpError from 'http-errors';
import logger from '../../config/logger';

export interface IYellowLeadDocument extends IYellowLead, Document { }

const yellowLeadSchema = new Schema<IYellowLeadDocument>(
  {
    date: {
      type: Date, required: [true, 'Lead Type Change Date is required'],
      set: (value: string) => convertToMongoDate(value)
    },
    name: { type: String, required: [true, 'Name is required'] },
    phoneNumber: {
      type: String,
      required: [true, 'Phone no is required'],
      match: [/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890']
    },
    altPhoneNumber: {
      type: String,
      match: [/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    gender: { type: String, enum: Object.values(Gender), default: Gender.NOT_TO_MENTION },
    assignedTo: { type: String, required: [true, 'Assigned To Field is required'] },
    location: { type: String },
    course: { type: String },
    campusVisit: { type: Boolean, default: false },
    nextCallDate: { type: Date },
    finalConversion: { type: String, enum: Object.values(FinalConversionType) },
    remarks: { type: String }
  },
  { timestamps: true }
);

yellowLeadSchema.pre<IYellowLeadDocument>('save', function (next) {
  if (typeof this.date === 'string') {
    this.date = convertToMongoDate(this.date);
  }
  if (typeof this.nextCallDate === 'string') {
    this.nextCallDate = convertToMongoDate(this.nextCallDate);
  }
  next();
});

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

export const YellowLead = mongoose.model<IYellowLeadDocument>('YellowLead', yellowLeadSchema);
