import { Schema } from "mongoose";
import { subjectDetailsSchema } from "./subject";
import { IScheduleSchema } from "../validators/scheduleSchema";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";

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
        type: Date
    },
    dateOfLecture: { 
        type: Date, 
    },
    confirmation: { 
        type: Boolean, 
    },
    remarks: { 
        type: String, 
        maxlength: [200, "Remarks must be at most 200 characters long"] 
    }
});
