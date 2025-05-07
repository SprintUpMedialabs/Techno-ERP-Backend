import mongoose, { Schema } from "mongoose";
import { IMarketingFollowUpSchema } from "../validators/marketingFollowUp";
import { Actions, COLLECTION_NAMES } from "../../config/constants";

export interface IMarketingFollowUpModel extends IMarketingFollowUpSchema, Document{}

export const marketingFollowUpModel = new Schema<IMarketingFollowUpModel>({
    currentLoggedInUser : {
        type : Schema.Types.ObjectId
    },
    leadId : {
        type : Schema.Types.ObjectId
    },
    action : {
        type : String,
        enum : {
            values : Object.values(Actions),
            message : "Invalid Action value"
        }
    }
})

export const MarketingFollowUpModel = mongoose.model<IMarketingFollowUpModel>(COLLECTION_NAMES.MARKETING_FOLLOW_UP_RAW_DATA, marketingFollowUpModel);

