import mongoose, { Schema } from "mongoose";
import { ICourseSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { Course } from "../../config/constants";
import { semesterSchema } from "./semester";

export interface ICourseDocument extends ICourseSchema, Document { }

const courseSchema = new Schema<ICourseDocument>({
    academicYear: {
        type: String,
        required: [true, "Academic year is required"],
        match: [/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"]
    },
    courseCode: {
        type: String,
        required: [true, "Course code is required"],
        enum: {
            values: Object.values(Course),
            message: "Invalid course code"
        },
        unique : true           //More than one course with same course code nahi chalega
    },
    department: {
        type: String,
        required: [true, "Department name is required"],
        minlength: [3, "Department name must be at least 3 characters long"],
        maxlength: [50, "Department name must be at most 50 characters long"]
    },
    collegeName: {
        type: String,
        required: [true, "College name is required"],
        minlength: [3, "College name must be at least 3 characters long"],
        maxlength: [100, "College name must be at most 100 characters long"]
    },
    hodName: {
        type: String,
        required: [true, "HOD name is required"],
        minlength: [3, "HOD name must be at least 3 characters long"],
        maxlength: [100, "HOD name must be at most 100 characters long"]
    },
    semester: {
        type: [semesterSchema],
        default: []
    }
},
{
        timestamps: true 
});


const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    } else if (error.name == 'MongooseError') {
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error);
    }
};

courseSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

courseSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    ['plannedDate', 'dateOfLecture'].forEach((key) => {
        if (ret[key]) {
            ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    return ret;
};

courseSchema.set('toJSON', { transform: transformDates });
courseSchema.set('toObject', { transform: transformDates });

export const CourseModel = mongoose.model<ICourseDocument>('Course', courseSchema);
