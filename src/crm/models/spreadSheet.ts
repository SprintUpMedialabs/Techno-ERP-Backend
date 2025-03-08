import mongoose, { Schema } from 'mongoose';
import { ISpreadSheetMetaData } from '../validators/spreadSheet';
import createHttpError from 'http-errors';

export interface ILeadDocument extends ISpreadSheetMetaData, Document { }

const spreadSheetSchema = new Schema<ISpreadSheetMetaData>(
  {
    name: { type: String, required: true },
    lastIdxMarketingSheet: { type: Number, required: true }
  },
  { timestamps: true }
);
// NOTE: here we are not putting error middleware as we don't want to showcase msg from here to the user.
  // as this is from the server side and we will be handling it in the server side only by checking up logs

export const SpreadSheetMetaData = mongoose.model<ISpreadSheetMetaData>(
  'spreadSheetMetaData',
  spreadSheetSchema
);
