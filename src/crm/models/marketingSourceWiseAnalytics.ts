import mongoose, { Schema } from "mongoose";
import { IBaseMarketingSourceWiseAnalyticsSchema, IMarketingSourceWiseAnalyticsSchema } from "../validators/marketingSourceWiseAnalytics";

export interface IBaseMarketingSourceWiseAnalyticsDocument extends IBaseMarketingSourceWiseAnalyticsSchema, Document { }
export interface IMarketingSourceWiseAnalyticsDocument extends IMarketingSourceWiseAnalyticsSchema, Document { }

const DataSchema = new Schema(
    {
        totalLeads: { type: Number, required: true },
        activeLeads: { type: Number, required: true },
        neutralLeads: { type: Number, required: true },
        didNotPickLeads: { type: Number, required: true },
        others: { type: Number, required: true },
        footFall: { type: Number, required: true },
        totalAdmissions: { type: Number, required: true },
    },
    { _id: false }
);

const BaseMarketingSourceSchema = new Schema<IBaseMarketingSourceWiseAnalyticsDocument>(
    {
        source: { type: String, required: true },
        data: { type: DataSchema, required: true },
    },
    { _id: false }
);

const MarketingSourceWiseAnalyticsSchema = new Schema<IMarketingSourceWiseAnalyticsDocument>(
    {
        type: {
            type: String,
            enum: ['all-leads', 'offline-data', 'online-data'],
            required: true,
        },
        details: {
            type: [BaseMarketingSourceSchema],
            required: true,
        },
    },
    { timestamps: true }
);


export const MarketingSourceWiseAnalytics = mongoose.model<IMarketingSourceWiseAnalyticsDocument>('MarketingSourceWiseAnalytics',MarketingSourceWiseAnalyticsSchema);