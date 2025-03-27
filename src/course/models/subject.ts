import { Schema } from "mongoose";
import { ISubjectDetailsSchema } from "../validators/subjectDetailsSchema";
import { scheduleSchema } from "./schedule";

export interface ISubjectDetailsDocument extends ISubjectDetailsSchema, Document { }

export const subjectDetailsSchema = new Schema<ISubjectDetailsDocument>(
{
    subjectName: {
        type: String,
        required: [true, "Subject name is required"],
        minlength: [3, "Subject name must be at least 3 characters long"],
        maxlength: [100, "Subject name must be at most 100 characters long"],
        unique : true       //ek subject ki ek baar hee entry karo
    },
    instructorName: {
        type: String,
        required: [true, "Instructor name is required"],
        minlength: [3, "Instructor name must be at least 3 characters long"],
        maxlength: [100, "Instructor name must be at most 100 characters long"]
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
