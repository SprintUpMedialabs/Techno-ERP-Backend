import { Schema } from "mongoose";
import { ISubjectDetailsDocument, subjectDetailsSchema } from "./subject";
import { ISemesterSchema } from "../validators/semesterSchema";

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


