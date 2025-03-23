import { Schema, model, Document } from 'mongoose';
import { Course, FeeType } from '../config/constants';


export interface ICourseFee {
    course: string;
    fee: number[]; // or some detailed fee objects, update as needed
}

export interface IOtherFee {
    type: FeeType;
    fee: number; // or object if more details needed
}

export interface ICourseAndOtherFeesDocument extends Document {
    courseFees: ICourseFee[];
    otherFees: IOtherFee[];
}

// Course Fee Schema
const CourseFeeSchema = new Schema<ICourseFee>(
    {
        course: {
            type: String,
            enum: {
                values: Object.values(Course),
                message: 'Invalid Course value'
            },
            required: true
        },
        fee: {
            type: [Number], // adjust if it's an object
            required: true
        }
    },
    { _id: false }
);

// Other Fee Schema
const OtherFeeSchema = new Schema<IOtherFee>(
    {
        type: {
            type: String,
            enum: Object.values(FeeType),
            required: true
        },
        fee: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

// Main Schema
const CourseAndOtherFeesSchema = new Schema<ICourseAndOtherFeesDocument>(
    {
        courseFees: {
            type: [CourseFeeSchema],
        },
        otherFees: {
            type: [OtherFeeSchema],
        }
    },
    { timestamps: true }
);

// Model
export const CourseAndOtherFeesModel = model<ICourseAndOtherFeesDocument>(
    'CourseAndOtherFees',
    CourseAndOtherFeesSchema
);
