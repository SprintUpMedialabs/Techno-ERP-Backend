import { Schema } from "mongoose";
import { ILecturePlanSchema, IPracticalPlanSchema, IScheduleSchema } from "../validators/scheduleSchema";
import { COLLECTION_NAMES, LectureConfirmation } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";

export interface ILecturePlanDocument extends ILecturePlanSchema, Document {};
export interface IPracticalPlanDocument extends IPracticalPlanSchema, Document {};
export interface IScheduleDocument extends IScheduleSchema, Document {};

export const lecturePlanModelSchema = new Schema<ILecturePlanDocument>({
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
        type: Number, 
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
    lecturePlan: [lecturePlanModelSchema],
    practicalPlan: [lecturePlanModelSchema],
    additionalResources: [{ type: String }],
});
