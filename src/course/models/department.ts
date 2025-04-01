import mongoose, { Schema } from "mongoose";
import { courseSchema, ICourseDocument } from "./course";
import { IDepartmentSchema } from "../validators/departmentSchema";
import createHttpError from "http-errors";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { objectIdSchema } from "../../validators/commonSchema";
import { COLLECTION_NAMES } from "../../config/constants";

export interface IDepartmentDocument extends IDepartmentSchema, Document {
    courses : ICourseDocument[]
}

const departmentSchema = new Schema<IDepartmentDocument>({
    departmentName: {
        type: String,
        required: [true, "Department name is required"],
        unique: true,
        minlength: [3, "Department name must be at least 3 characters long"],
        maxlength: [50, "Department name must be at most 50 characters long"]
    },
    // DTODO: let's add object id here => Done
    hod: {
        type: Schema.Types.ObjectId,
        ref : COLLECTION_NAMES.USER,
        required: [true, "HOD name is required"],
        minlength: [3, "HOD name must be at least 3 characters long"],
        maxlength: [100, "HOD name must be at most 100 characters long"]
    },
    courses: {
        type: [courseSchema],
        default: [],
    }
}, { timestamps: true });



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

departmentSchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

departmentSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
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

departmentSchema.set('toJSON', { transform: transformDates });
departmentSchema.set('toObject', { transform: transformDates });

// DTODO: lets create one enum for collection name and also use it in Ref => Done
export const DepartmentModel = mongoose.model<IDepartmentDocument>(COLLECTION_NAMES.DEPARTMENT_COURSE, departmentSchema);
