import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTION_NAMES, AdmissionAggregationType } from '../../config/constants';

export interface IAdmissionAnalytics {
    type: AdmissionAggregationType;
    date: Date; // Store as ISO Date internally
    count: number;
    courseCode: string; // e.g., "ALL" or specific course
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
        courseCode: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Optional compound index if you're querying often by (type + date + courseCode)
admissionAnalyticsSchema.index({ type: 1, date: 1, courseCode: 1 }, { unique: true });

export const AdmissionAnalyticsModel = mongoose.model<IAdmissionAnalyticsDocument>(
    COLLECTION_NAMES.ADMISSION_ANALYTICS,
    admissionAnalyticsSchema
);
