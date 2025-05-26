import mongoose, { model, Schema } from "mongoose";
import { IBaseMarketingUserWiseAnalyticsSchema, IMarketingUserWiseAnalyticsSchema } from "../validators/marketingUserWiseAnalyticsSchema";
import { COLLECTION_NAMES } from "../../config/constants";

export interface IBaseMarketingUserWiseAnalyticsDocument extends IBaseMarketingUserWiseAnalyticsSchema, Document { }
export interface IMarketingUserWiseAnalyticsDocument extends IMarketingUserWiseAnalyticsSchema, Document { }

const BaseMarketingUserWiseAnalyticsSchema = new Schema<IBaseMarketingUserWiseAnalyticsDocument>({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: COLLECTION_NAMES.USER, 
        required: true 
    },
    userFirstName: { 
        type: String, 
        default: ''
    },
    userLastName: { 
        type: String, 
        default: ''
    },
    totalCalls: { 
        type: Number, 
        required: true,
        default : 0
    },
    newLeadCalls: { 
        type: Number, 
        required: true,
        default : 0 
    },
    activeLeadCalls: { 
        type: Number, 
        required: true,
        default : 0
    },
    nonActiveLeadCalls: { 
        type: Number, 
        required: true,
        default : 0 
    },
    totalFootFall: { 
        type: Number, 
        required: true,
        default : 0
    },
    totalAdmissions: { 
        type: Number, 
        required: true,
        default : 0
    },
}, { _id: false });


const MarketingUserWiseAnalyticsSchema = new Schema<IMarketingUserWiseAnalyticsDocument>({
    date: { 
        type: Date, 
        required: true 
    },
    data: { 
        type: [BaseMarketingUserWiseAnalyticsSchema], 
        default: [] 
    },
}, { timestamps: true });

export const MarketingUserWiseAnalytics = model<IMarketingUserWiseAnalyticsDocument>(COLLECTION_NAMES.MARKETING_USER_WISE_ANALYTICS,MarketingUserWiseAnalyticsSchema);