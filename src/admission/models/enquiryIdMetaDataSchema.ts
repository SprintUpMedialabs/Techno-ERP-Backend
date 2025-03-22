import mongoose, { Schema } from "mongoose";
import { IEnquiryIdMetaDataSchema } from "../validators/enquiryIdMetaDataSchema";
import { FormNoPrefixes } from "../../config/constants";

export interface IEnquiryMetaDataDocument extends IEnquiryIdMetaDataSchema, Document{}

const enquiryApplicationIdSchema  = new Schema<IEnquiryMetaDataDocument>({
    prefix: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(FormNoPrefixes),
      },
      lastSerialNumber: {
        type: Number,
        required: true,
      }
})

export const EnquiryApplicationId = mongoose.model<IEnquiryMetaDataDocument>('EnquiryApplicationId', enquiryApplicationIdSchema);
