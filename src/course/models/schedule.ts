import { Schema } from "mongoose";
import {  IPlanSchema, IScheduleSchema } from "../validators/scheduleSchema";
import { COLLECTION_NAMES, LectureConfirmation } from "../../config/constants";
import { convertToDDMMYYYY, convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import createHttpError from "http-errors";

export interface ILecturePlanDocument extends IPlanSchema, Document {};
export interface IScheduleDocument extends IScheduleSchema, Document {};

export const planModelSchema = new Schema<ILecturePlanDocument>({
    unit: { 
        type: Number, 
        required: [true, 'Unit Number is required.'], 
        min: [0, 'Unit Number must be a valid value.'] 
    },
    lectureNumber: { 
        type: Number, 
        required: [true, 'Lecture Number is required.'], 
        min: [0, 'Lecture number must be a valid value.'] 
    },
    topicName: { 
        type: String, 
        required: [true, 'Topic Name is required.'] 
    },
    instructor: {
        type: Schema.Types.ObjectId,
        ref: COLLECTION_NAMES.USER,
    },
    plannedDate: { 
        type: Date, 
        required: [true, 'Planned Date is required'], 
        set: (value: string) => {
            return convertToMongoDate(value);
        }
    },
    actualDate: { 
        type: Date,
        set: (value: string | undefined) => {
            return value ? convertToMongoDate(value) : undefined;
        },
    },
    classStrength: { 
        type: Number, 
    },
    attendance: {
        type: Number,
        validate: {
            validator: function (this: ILecturePlanDocument, value: number) {
                if (value === undefined || this.classStrength === undefined) 
                {
                    return true;
                }
                return value <= this.classStrength;
            },
            message: "Attendance cannot exceed class strength",
        },
    },
    absent: { 
        type: Number
    },
    confirmation: {
        type: String,
        enum : {
            values : Object.values(LectureConfirmation),
            message: 'Invalid Confirmation Value'
        },
        default: LectureConfirmation.TO_BE_DONE,
    },
    remarks: { 
        type: String 
    },
    documents: [
        { 
            type: String
        }
    ],
});


export const scheduleModelSchema = new Schema<IScheduleDocument>({
    lecturePlan: [planModelSchema],
    practicalPlan: [planModelSchema],
    additionalResources: [{ type: String }],
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

scheduleModelSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

scheduleModelSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
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

scheduleModelSchema.set('toJSON', { transform: transformDates });
scheduleModelSchema.set('toObject', { transform: transformDates });
