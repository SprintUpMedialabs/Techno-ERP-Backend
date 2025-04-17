import { Schema } from "mongoose";
import { IScheduleSchema } from "../validators/scheduleSchema";
import { convertToDDMMYYYY, convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import createHttpError from "http-errors";

export interface IScheduleDocument extends IScheduleSchema, Document { }

export const scheduleSchema = new Schema<IScheduleDocument>({
    lectureNumber: { 
        type: Number, 
        min: [1, "Lecture number must be greater than 0"],
    },
    topicName: { 
        type: String, 
        minlength: [3, "Topic name must be at least 3 characters long"],
        maxlength: [100, "Topic name must be at most 100 characters long"]
    },
    description: { 
        type: String, 
        maxlength: [500, "Description must be at most 500 characters long"]
    },
    plannedDate: { 
        type: Date,
        set: (value: string) => {
            return convertToMongoDate(value);
        }
    },
    dateOfLecture: { 
        type: Date, 
        set: (value: string) => {
            return convertToMongoDate(value);
        }
    },
    confirmation: { 
        type: Boolean, 
    },
    remarks: { 
        type: String, 
        maxlength: [200, "Remarks must be at most 200 characters long"] 
    }
});



const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw createHttpError(400, "Semester with this semester details already exists");     
    } 
    else if (error.name == 'MongooseError') {
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error);
    }
};

scheduleSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

scheduleSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    ['plannedDate', 'dateOfLecture'].forEach((key) => {
        if (ret[key]) {
            ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

scheduleSchema.set('toJSON', { transform: transformDates });
scheduleSchema.set('toObject', { transform: transformDates });
