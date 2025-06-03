import moment from 'moment-timezone';
import mongoose, { Document, Schema } from 'mongoose';
import { AdmissionAggregationType, COLLECTION_NAMES } from '../../config/constants';

export interface IAdmissionAnalytics {
    type: AdmissionAggregationType;
    date: Date; // Store as ISO Date internally
    count: number;
    courseName: string; // e.g., "ALL" or specific course
}

export interface IAdmissionAnalyticsDocument extends IAdmissionAnalytics, Document { }

const admissionAnalyticsSchema = new Schema<IAdmissionAnalyticsDocument>(
    {
        type: {
            type: String,
            enum: Object.values(AdmissionAggregationType),
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        count: {
            type: Number,
            required: true,
            default: 0,
        },
        courseName: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Optional compound index if you're querying often by (type + date + courseName)
admissionAnalyticsSchema.index({ type: 1, date: 1, courseName: 1 }, { unique: true });

const transformDates = (_: any, ret: any) => {
    ['date'].forEach((key) => {
      ret[key] = moment(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY');
    });
    delete ret.createdAt;
    delete ret.__v;
    return ret;
  };
  
  admissionAnalyticsSchema.set('toJSON', { transform: transformDates });
  admissionAnalyticsSchema.set('toObject', { transform: transformDates });

export const AdmissionAnalyticsModel = mongoose.model<IAdmissionAnalyticsDocument>(
    COLLECTION_NAMES.ADMISSION_ANALYTICS,
    admissionAnalyticsSchema
);
