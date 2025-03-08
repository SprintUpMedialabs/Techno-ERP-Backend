import mongoose, { Document, Schema } from 'mongoose';
import { ILead } from '../validators/leads';
import { Gender, LeadType } from '../../config/constants';
import createHttpError from 'http-errors';

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    // srNo: { type: Number, required: [true, 'Serial Number is required'] },

    // Change format to DD/MM/YYYY and add error message
    date: {
      type: Date,
      required: [true, 'Date is required']
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
      type: Date
    }
  },
  { timestamps: true }
);

const handleMongooseError = (error: any, next: Function) => {
  console.log(error);
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

export const Lead = mongoose.model<ILeadDocument>('Lead', leadSchema);
