import { Schema } from "mongoose";
import { ISingleDocumentSchema } from "../validators/singleDocumentSchema";
import { DocumentType } from "../../config/constants";
import { optional } from "zod";
import { objectIdSchema } from "../../validators/commonSchema";
export interface ISingleDocument extends ISingleDocumentSchema, Document {}

export const singleDocumentSchema = new Schema({
    type: {
      type: String,
      enum: Object.values(DocumentType)
    },
    fileUrl : {
      type : String
    },
    dueBy : {
      type: Date,
      optional : true
    },
});