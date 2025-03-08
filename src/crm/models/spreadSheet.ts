import mongoose, { Schema } from 'mongoose';
import { ISpreadSheetMetaData } from '../validators/spreadSheet';

export interface ILeadDocument extends ISpreadSheetMetaData, Document {}

const spreadSheetSchema = new Schema<ISpreadSheetMetaData>(
  {
    lastIdxMarketingSheet: { type: Number }
  },
  { timestamps: true }
);

export const SpreadSheetMetaData = mongoose.model<ISpreadSheetMetaData>(
  'spreadSheetMetaData',
  spreadSheetSchema
);
