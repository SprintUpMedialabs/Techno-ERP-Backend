import { Schema } from "mongoose";
import { ISingleDocumentSchema } from "../validators/singleDocumentSchema";
import { DocumentType } from "../../config/constants";
import { objectIdSchema } from "../../validators/commonSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
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
      required : false,
      set: (value: string) => {
        return convertToMongoDate(value);
      }
    },
});