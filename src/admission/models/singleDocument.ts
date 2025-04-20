import { Schema } from "mongoose";
import { DocumentType } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { ISingleDocumentSchema } from "../validators/singleDocumentSchema";
export interface ISingleDocument extends ISingleDocumentSchema, Document {}

export const singleDocumentSchema = new Schema({
    type: {
      type: String,
      enum: Object.values(DocumentType)
    },
    fileUrl : {
      type : String,
    },
    dueBy : {
      type: Date,
      required : false,
      set: (value: string) => {
        return typeof value === 'string' ? convertToMongoDate(value) : value;
      }
    },
});