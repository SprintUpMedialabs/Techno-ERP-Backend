import mongoose, { Schema } from "mongoose";
import { IDepartmentMetaDataSchema } from "../validators/departmentSchema";
import { COLLECTION_NAMES } from "../../config/constants";
import createHttpError from "http-errors";

export interface IDepartmentMetaDataDocument extends IDepartmentMetaDataSchema, Document {};

export const departmentModelSchema = new Schema<IDepartmentMetaDataDocument>({
    departmentName : {
      type: String,
      required: [true, 'Department Name is required'],
    },
    departmentHODId : {
      type : Schema.Types.ObjectId,
      ref : COLLECTION_NAMES.USER
    },
    departmentHOD : {
        type: String,
        required: [true, 'Department HOD Name is required'],
    },
    instructors : {
      type : [Schema.Types.ObjectId],
      ref : COLLECTION_NAMES.USER,
      default : []
    }
}, { timestamps : true });

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

departmentModelSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

departmentModelSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  delete ret.createdAt;
  delete ret.updatedAt;
  delete ret.__v;
  return ret;
};

departmentModelSchema.set('toJSON', { transform: transformDates });
departmentModelSchema.set('toObject', { transform: transformDates });

export const DepartmentMetaData = mongoose.model<IDepartmentMetaDataDocument>(COLLECTION_NAMES.DEPARTMENT_META_DATA, departmentModelSchema);