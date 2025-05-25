import mongoose, { Schema } from "mongoose";
import { ISubjectSchema } from "../validators/subjectSchema";
import { COLLECTION_NAMES } from "../../config/constants";
import { scheduleModelSchema } from "./schedule";
import createHttpError from "http-errors";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";

export interface ISubjectDocument extends ISubjectSchema, Document { 
    isDeleted : boolean
};


export const subjectModelSchema = new Schema<ISubjectDocument>({
    subjectName: {
        type: String,
        required: [true, "Subject Name is required."],
    },
    subjectCode: {
        type: String,
        required: [true, "Subject Code is required."],
    },
    instructor: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: COLLECTION_NAMES.USER
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    schedule: {
        type: scheduleModelSchema,
        default: {}
    }
});


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

subjectModelSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

subjectModelSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    ['actualDate', 'plannedDate'].forEach((key) => {
        if (ret[key]) {
          ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

subjectModelSchema.set('toJSON', { transform: transformDates });
subjectModelSchema.set('toObject', { transform: transformDates });



