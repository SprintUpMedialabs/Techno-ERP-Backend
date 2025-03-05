import mongoose, { Document, Schema } from 'mongoose';
import { ILead } from '../validators/leads';
import { Gender, LeadType } from '../../config/constants';

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    srNo: { type: Number },
    date: { type: String , required: true, match: /^\d{2}-\d{2}-\d{4}$/ },
    source : { type : String , required : true},
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true, match: /^\+91\d{10}$/ },
    altPhoneNumber: { type: String, match: /^\+91\d{10}$/ },
    email : { type : String },
    gender: { type: String, enum: Object.values(Gender) },
    location: { type: String },
    course: { type: String },
    assignedTo: { type: String },
    leadType: { type: String, enum: Object.values(LeadType), required: true },
    remarks: { type: String },
    leadTypeModified: { type: String },
    nextDueDate: { type: String, match: /^\d{2}-\d{2}-\d{4}$/ },
  },
  { timestamps: true }
);

export const Lead = mongoose.model<ILeadDocument>('Lead', leadSchema);
