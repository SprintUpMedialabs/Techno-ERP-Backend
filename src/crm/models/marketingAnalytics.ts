import mongoose, { Schema } from "mongoose";
import { IBaseMarketingAnalyticsSchema, IMarketingAnalyticsSchema } from "../validators/marketingAnalytics";
import { COLLECTION_NAMES, MarketingAnalyticsEnum } from "../../config/constants";

export interface IBaseMarketingAnalyticsModel extends IBaseMarketingAnalyticsSchema, Document { }
export interface IMarketingAnalyticsModel extends IMarketingAnalyticsSchema, Document { }

const baseMarketingAnalyticsModel = new Schema<IBaseMarketingAnalyticsModel>({
    date: { type: Date, required: true },
    data: [{
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        noOfCalls: {
            type: Number,
            required: true
        }
    }]
});

export const marketingAnalyticsModel = new Schema<IMarketingAnalyticsModel>({
    type: {
        type: String,
        enum: Object.values(MarketingAnalyticsEnum),
        required: true
    },
    lastUpdatedAt: {
        type: Date,
        required: true
    },
    details: {
        type: [baseMarketingAnalyticsModel],
        required: true
    }
});

export const MarketingAnalyticsModel = mongoose.model<IMarketingAnalyticsModel>(COLLECTION_NAMES.MARKETING_ANALYTICS, marketingAnalyticsModel);
