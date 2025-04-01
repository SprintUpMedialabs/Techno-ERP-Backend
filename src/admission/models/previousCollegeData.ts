import { Schema } from 'mongoose';
import { IPreviousCollegeDataSchema } from '../validators/previousCollegeDataSchema';

export interface IPreviousCollegeDataDocument extends IPreviousCollegeDataSchema, Document {}

export const previousCollegeDataSchema = new Schema<IPreviousCollegeDataDocument>({
  collegeName: {
    type: String
  },
  district: {
    type: String
  },
  boardUniversity: {
    type: String
  },
  passingYear: {
    type: Number,
    validate: {
      validator: (year: number) => year.toString().length === 4,
      message: 'Passing Year must be a valid 4-digit year'
    }
  },
  aggregatePercentage: {
    type: Number,
    min: [0, 'Percentage must be at least 0'],
    max: [100, 'Percentage cannot exceed 100']
  }
});
