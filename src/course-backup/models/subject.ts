import { Schema } from "mongoose";
import { ISubjectDetailsSchema } from "../validators/subjectDetailsSchema";
import { scheduleSchema } from "./schedule";
import createHttpError from "http-errors";
import { COLLECTION_NAMES } from "../../config/constants";

export interface ISubjectDetailsDocument extends ISubjectDetailsSchema, Document {
    schedule : [typeof scheduleSchema]
}

export const subjectDetailsSchema = new Schema<ISubjectDetailsDocument>(
{
    subjectName: {
        type: String,
        required: [true, "Subject name is required"],
        minlength: [3, "Subject name must be at least 3 characters long"],
        maxlength: [100, "Subject name must be at most 100 characters long"],
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref : COLLECTION_NAMES.USER,
        required: [true, "Instructor information is required"],
    },
    subjectCode: {
        type: String,
        required: [true, "Subject code is required"],
        minlength: [3, "Subject code must be at least 3 characters long"],
        maxlength: [10, "Subject code must be at most 10 characters long"]
    },
    schedule: {
        type: [scheduleSchema],
        default : []
    }
});


const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        console.log(firstError.message)
        throw createHttpError(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw createHttpError(400, "Department with this department details already exists");       //If course would be duplicated in department, this error would handle that
    } 
    else if (error.name == 'MongooseError') {
        console.log(error.message);
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error);
    }
};

subjectDetailsSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

subjectDetailsSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

subjectDetailsSchema.set('toJSON', { transform: transformDates });
subjectDetailsSchema.set('toObject', { transform: transformDates });

