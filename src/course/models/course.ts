import mongoose, { Schema } from "mongoose";
import { ICourseSchema } from "../validators/courseSchema";
import { semesterModelSchema } from "./semester";
import { COLLECTION_NAMES } from "../../config/constants";
import createHttpError from "http-errors";

export interface ICourseDocument extends ICourseSchema, Document {};

const courseModelSchema = new Schema<ICourseDocument>({
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true },
    collegeName: { type: String, required: true },
    departmentMetaDataId : {
        type : Schema.Types.ObjectId,
        ref : COLLECTION_NAMES.DEPARTMENT_META_DATA
    },
    startingYear: {
      type: Number,
      required: true,
      min: [1000, "Starting year must be a valid 4-digit year"], 
      max: [9999, "Starting year must be a valid 4-digit year"], 
    },
    totalSemesters : {
        type : Number
    },
    semester: {
        type : [semesterModelSchema],
        default : []
    } 
}, { timestamps : true} );



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

courseModelSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

courseModelSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

courseModelSchema.set('toJSON', { transform: transformDates });
courseModelSchema.set('toObject', { transform: transformDates });

export const Course = mongoose.model<ICourseDocument>(COLLECTION_NAMES.COURSE, courseModelSchema);

