import { Schema } from "mongoose";
import { ISingleDocumentSchema } from "../validators/singleDocumentSchema";
import { DocumentType } from "../../config/constants";
export interface ISingleDocument extends ISingleDocumentSchema, Document {}

export const singleDocumentSchema = new Schema({
    type: {
      type: String,
      enum: Object.values(DocumentType)
    },
    fileUrl : {
      type : String
    }
});