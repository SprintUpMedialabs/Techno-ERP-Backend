import mongoose, { Schema } from "mongoose";
import { IDepartmentMetaDataSchema } from "../validators/departmentSchema";
import { COLLECTION_NAMES } from "../../config/constants";

export interface IDepartmentMetaDataDocument extends IDepartmentMetaDataSchema, Document {};

export const departmentModelSchema = new Schema<IDepartmentMetaDataDocument>({
    departmentName : {
      type: String,
      required: [true, 'Department Name is required'],
    },
    departmentHOD : {
        type: String,
        required: [true, 'Department HOD Name is required'],
    },
    startingYear: {
        type: Number,
        required: [true, 'Starting year is required'],
        validate: {
          validator: (val: number) => /^\d{4}$/.test(val.toString()),
          message: 'Year must be a valid 4 digit number!',
        },
    },
    // There is no need to validate here as it will be taken care of by ZOD Schema.
    endingYear : {
        type: Number,
    },
}, { timestamps : true });


export const DepartmentMetaData = mongoose.model<IDepartmentMetaDataDocument>(COLLECTION_NAMES.DEPARTMENT_META_DATA, departmentModelSchema);