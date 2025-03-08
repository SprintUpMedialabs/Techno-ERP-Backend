import mongoose, { Document, Schema } from 'mongoose';
import { IYellowLead } from '../validators/yellowLead';
import { Gender, FinalConversionType } from '../../config/constants';
import { convertToMongoDate } from '../utils/convertDateToFormatedDate';
import createHttpError from 'http-errors';

export interface IYellowLeadDocument extends IYellowLead, Document {}

const yellowLeadSchema = new Schema<IYellowLeadDocument>(
  {
    srNo: {
      type: Number,
      required: [true, 'Serial No Required'],
      unique: [true, 'Duplicate Serial No is Not Allowed']
    },
    leadTypeChangeDate: { type: Date, required: [true, 'Lead Type Change Date is required'] },
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
    assignedTo: { type: String },
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
  if (typeof this.leadTypeChangeDate === 'string') {
    this.leadTypeChangeDate = convertToMongoDate(this.leadTypeChangeDate);
  }
  if (typeof this.nextCallDate === 'string') {
    this.nextCallDate = convertToMongoDate(this.nextCallDate);
  }
  next();
});

const handleMongooseError = (error: any, next: Function) => {
  console.log(error);
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
export const YellowLead = mongoose.model<IYellowLeadDocument>('YellowLead', yellowLeadSchema);
