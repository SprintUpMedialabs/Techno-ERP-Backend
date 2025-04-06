import createHttpError from 'http-errors';
import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTION_NAMES, Course, FinalConversionType, Gender, LeadType, Locations } from '../../config/constants';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { ILeadMaster } from '../validators/leads';
import moment from 'moment-timezone';

export interface ILeadMasterDocument extends ILeadMaster, Document { }

const leadSchema = new Schema<ILeadMasterDocument>(
  {
    // Change format to DD/MM/YYYY and add error message
    date: {
      type: Date,
      required: [true, 'Date is required'],
      set: (value: string) => { return convertToMongoDate(value) }
    },

    source: { 
      type: String,
      index : true
    },

    // Accepts only alphabets (both uppercase and lowercase) and spaces
    name: {
      type: String,
      required: [true, 'Name is required'],
      match: [/^[A-Za-z\s]+$/, 'Name can only contain alphabets and spaces'],
      index : true
    },
    // Must be a unique Indian phone number (+91 followed by 10 digits)
    phoneNumber: {
      type: String,
      required: [true, 'Phone Number is required'],
      unique: [true, 'Phone Number already exists'],
      match: [/^\d{10}$/, 'Invalid phone number format, expected: 10 digits'],
      index : true
    },
    // Optional alternate phone number; must follow the same format as phoneNumber
    altPhoneNumber: {
      type: String,
      match: [/^\d{10}$/, 'Invalid alternative phone number format, expected: 10 digits']
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
    area: {
      type: String,
    },

    city: {
      type: String,
      enum: {
        values: Object.values(Locations),
        message: 'Invalid City Value'
      }
    },
    course: {
      type: String, 
      enum: {
        values: Object.values(Course),
        message: 'Invalid Course Value'
      }
    },

    // Required field with a custom validation error message
    assignedTo: {
      type: Schema.Types.ObjectId,
      required: [true, 'Assigned To is required']
    },

    // Must be one of the predefined lead types; defaults to "ORANGE"
    leadType: {
      type: String,
      enum: {
        values: Object.values(LeadType),
        message: 'Invalid lead type'
      },
      default: LeadType.OPEN
    },

    remarks: { type: String },
    leadTypeModifiedDate: { type: Date },

    nextDueDate: {
      type: Date,
      set: (value: string) => {
        return convertToMongoDate(value);
      }
    },
    footFall: { type: Boolean, default: false },
    finalConversion: { 
      type: String, enum: Object.values(FinalConversionType),
      default: FinalConversionType.NO_FOOTFALL
    },

    leadsFollowUpCount : {
      type : Number,
      default : 0
    },
    yellowLeadsFollowUpCount : {
      type : Number,
      default : 0
    }
  },
  { timestamps: true }
);

const handleMongooseError = (error: any, next: Function) => {
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
    if (key == 'leadTypeModifiedDate') {
      ret[key] = moment(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY | HH:mm');
    } else if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  delete ret.createdAt;
  delete ret.updatedAt;
  delete ret.__v;
  return ret;
};

leadSchema.set('toJSON', { transform: transformDates });
leadSchema.set('toObject', { transform: transformDates });

export const LeadMaster = mongoose.model<ILeadMasterDocument>(COLLECTION_NAMES.LEAD, leadSchema);