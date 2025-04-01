import { Schema } from "mongoose";
import { ISubjectDetailsDocument, subjectDetailsSchema } from "./subject";
import { ISemesterSchema } from "../validators/semesterSchema";
import createHttpError from "http-errors";

export interface ISemesterDocument extends ISemesterSchema, Document { 
    subjectDetails: ISubjectDetailsDocument[];
}

export const semesterSchema = new Schema<ISemesterDocument>({
    semesterNumber: {
        type: Number,
        required: [true, "Semester number is required"],
        min: [1, "Semester number must be greater than 0"],
        max: [10, "Semester number cannot exceed 10"],
    },
    subjectDetails: {
        type: [subjectDetailsSchema],
        default: [],
    },
});


const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        console.log(firstError.message)
        throw createHttpError(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw createHttpError(400, "Semester with this semester details already exists");     
    } 
    else if (error.name == 'MongooseError') {
        console.log(error.message);
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error);
    }
};

semesterSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

semesterSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    // ['plannedDate', 'dateOfLecture'].forEach((key) => {
    //     if (ret[key]) {
    //         ret[key] = convertToDDMMYYYY(ret[key]);
    //     }
    // });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

semesterSchema.set('toJSON', { transform: transformDates });
semesterSchema.set('toObject', { transform: transformDates });
