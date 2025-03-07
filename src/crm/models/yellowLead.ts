import mongoose, { Document, Schema } from 'mongoose';
import { IYellowLead } from '../validators/yellowLead';
import { Gender, FinalConversionType } from '../../config/constants';

export interface IYellowLeadDocument extends IYellowLead, Document {}
// giving custom message on required field
const yellowLeadSchema = new Schema<IYellowLeadDocument>(
  {
    srNo: { type: Number, required: true, unique: true },
    leadTypeChangeDate: {
      type: String,
      match: [/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format, expected DD-MM-YYYY']
    },
    name: { type: String, required: true },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890']
    },
    altPhoneNumber: {
      type: String,
      match: [/^\+91\d{10}$/, 'Invalid contact number format. Expected: +911234567890']
    },
    email: {
      type: String,
      required: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    gender: { type: String, enum: Object.values(Gender), default: Gender.NOT_TO_MENTION },
    assignedTo: { type: String },
    location: { type: String },
    course: { type: String },
    campusVisit: { type: Boolean, default: false },
    nextCallDate: {
      type: String,
      match: [/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format, expected DD-MM-YYYY']
    },
    finalConversion: { type: String, enum: Object.values(FinalConversionType) },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const YellowLead = mongoose.model<IYellowLeadDocument>('YellowLead', yellowLeadSchema);
