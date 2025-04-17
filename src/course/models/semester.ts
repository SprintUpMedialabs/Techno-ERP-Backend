import { Schema } from "mongoose";
import { ISemesterSchema } from "../validators/semesterSchema";
import { subjectModelSchema } from "./subject";
import createHttpError from "http-errors";

export interface ISemesterDocument extends ISemesterSchema, Document {};

export const semesterModelSchema = new Schema<ISemesterDocument>({
    semesterNumber: { type: Number, required: true },
    academicYear: {
      type: String,
      required: true,
      match: /^\d{4}-\d{4}$/,
    },
    subjects: {
        type : [subjectModelSchema],
        default : []
    }
})
  
const handleMongooseError = (error: any, next: Function) => {
  if (error.name === 'ValidationError') {
      const firstError = error.errors[Object.keys(error.errors)[0]];
      throw createHttpError(400, firstError.message);
  }
  else if (error.name == 'MongooseError') {
      throw createHttpError(400, `${error.message}`);
  } else {
      next(error);
  }
};

semesterModelSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

semesterModelSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  delete ret.createdAt;
  delete ret.updatedAt;
  delete ret.__v;
  return ret;
};

semesterModelSchema.set('toJSON', { transform: transformDates });
semesterModelSchema.set('toObject', { transform: transformDates });
