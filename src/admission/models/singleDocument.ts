import { Schema } from "mongoose";
import { ISingleDocumentSchema } from "../validators/singleDocumentSchema";

export interface ISingleDocument extends ISingleDocumentSchema, Document {}

export const singleDocumentSchema = new Schema<ISingleDocument>({
    type: {
      type: String,
      enum: Object.values(DocumentType)
    },
    documentBuffer: {
      type: Buffer
    }
});