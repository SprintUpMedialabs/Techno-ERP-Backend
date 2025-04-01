import { Schema } from 'mongoose';
import { EducationLevel } from '../../config/constants';
import { IAcademicDetailSchema } from '../validators/academicDetailSchema';

export interface IAcademicDetailDocument extends IAcademicDetailSchema, Document {}

export const academicDetailFormSchema = new Schema<IAcademicDetailDocument>({
  educationLevel : {
    type: String,
    enum: Object.values(EducationLevel)
  },
  schoolCollegeName: {
    type: String
  },
  universityBoardName: {
    type: String
  },
  passingYear: {
    type: Number,
    validate: {
      validator: (year: number) => year.toString().length === 4,
      message: 'Passing Year must be a valid 4-digit year'
    }
  },
  percentageObtained: {
    type: Number,
    min: [0, 'Percentage must be at least 0'],
    max: [100, 'Percentage cannot exceed 100']
  },
  subjects: {
    type: [String],
  }
});
