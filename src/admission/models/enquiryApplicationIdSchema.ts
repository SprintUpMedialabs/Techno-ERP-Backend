import mongoose, { Schema } from "mongoose";
import { IEnquiryApplicationIdSchema } from "../validators/enquiryApplicationIdSchema";
import { ApplicationIdPrefix } from "../../config/constants";

export interface IApplicationIdDocument extends IEnquiryApplicationIdSchema, Document{}

const enquiryApplicationIdSchema  = new Schema<IApplicationIdDocument>({
    prefix: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(ApplicationIdPrefix),
      },
      lastSerialNumber: {
        type: Number,
        required: true,
      }
})

export const EnquiryApplicationId = mongoose.model<IApplicationIdDocument>('EnquiryApplicationId', enquiryApplicationIdSchema);
