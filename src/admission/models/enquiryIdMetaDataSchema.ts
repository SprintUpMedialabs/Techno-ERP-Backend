import mongoose, { Schema } from "mongoose";
import { IEnquiryIdMetaDataSchema } from "../validators/enquiryIdMetaDataSchema";
import { COLLECTION_NAMES, FormNoPrefixes } from "../../config/constants";

export interface IEnquiryMetaDataDocument extends IEnquiryIdMetaDataSchema, Document { }

const enquiryIdMetaDataSchema = new Schema<IEnquiryMetaDataDocument>({
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

export const EnquiryApplicationId = mongoose.model<IEnquiryMetaDataDocument>(COLLECTION_NAMES.ENQUIRY_ID_META_DATA, enquiryIdMetaDataSchema);
