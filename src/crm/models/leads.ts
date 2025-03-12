import createHttpError from 'http-errors';
import mongoose, { Document, HydratedDocument, Schema } from 'mongoose';
import { Gender, LeadType } from '../../config/constants';
import logger from '../../config/logger';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { ILead } from '../validators/leads';

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    // Change format to DD/MM/YYYY and add error message
    date: {
      type: Date,
      required: [true, 'Date is required'],
      // set: (value: string) => { return convertToMongoDate(value) }
    },

    source: { type: String },

    // Accepts only alphabets (both uppercase and lowercase) and spaces
    name: {
      type: String,
      required: [true, 'Name is required'],
      match: [/^[A-Za-z\s]+$/, 'Name can only contain alphabets and spaces']
    },

    // Must be a unique Indian phone number (+91 followed by 10 digits)
    phoneNumber: {
      type: String,
      required: [true, 'Phone Number is required'],
      unique: [true, 'Phone Number already exists'],
      match: [/^\+91\d{10}$/, 'Invalid phone number format, expected: +91XXXXXXXXXX']
    },

    // Optional alternate phone number; must follow the same format as phoneNumber
    altPhoneNumber: {
      type: String,
      match: [/^\+91\d{10}$/, 'Invalid alternate phone number format, expected: +91XXXXXXXXXX']
    },

    // Email validation using regex
    email: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },

    // Optional gender field that must be one of the predefined enum values
    gender: {
      type: String,
      enum: {
        values: Object.values(Gender),
        message: 'Invalid gender value'
      }
    },

    location: { type: String },
    course: { type: String },

    // Required field with a custom validation error message
    assignedTo: {
      type: String,
      required: [true, 'Assigned To is required']
    },

    // Must be one of the predefined lead types; defaults to "ORANGE"
    leadType: {
      type: String,
      enum: {
        values: Object.values(LeadType),
        message: 'Invalid lead type'
      },
      default: LeadType.ORANGE
    },

    remarks: { type: String },
    leadTypeModifiedDate: { type: Date },

    nextDueDate: {
      type: Date,
      set: (value: string) => {
        console.log(value);
        return convertToMongoDate(value);
      }
    }
  },
  { timestamps: true }
);

const handleMongooseError = (error: any, next: Function) => {
  logger.error(error);
  if (error.code === 11000) {
    throw createHttpError(400, 'Phone Number already exists');
  } else if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else if (error.name == 'MongooseError') {
    throw createHttpError(400, `${error.message}`);
  } else {
    next(error); // Pass any other errors to the next middleware
  }
};

leadSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

leadSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  ['leadTypeModifiedDate', 'nextDueDate', 'date'].forEach((key) => {
    if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  return ret;
};

leadSchema.pre('save', function (this: HydratedDocument<ILead>, next: () => void) {
  console.log("In pre save hook");
  if (this.date) {
    this.date = convertToMongoDate(this.date.toString());
  }
  next();
});



leadSchema.set('toJSON', { transform: transformDates });
leadSchema.set('toObject', { transform: transformDates });

export const Lead = mongoose.model<ILeadDocument>('Lead', leadSchema);
