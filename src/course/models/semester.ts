import mongoose, { Schema } from "mongoose";
import { ICourseSchema } from "../validators/courseSchema";
import createHttpError from "http-errors";
import { Course } from "../../config/constants";
import { subjectDetailsSchema } from "./subject";
import { ISemesterSchema } from "../validators/semesterSchema";

export interface ISemesterDocument extends ISemesterSchema, Document { }

export const semesterSchema = new Schema<ISemesterDocument>({
    semesterNumber: {
        type: Number,
        required: [true, "Semester number is required"],
        min: [1, "Semester number must be greater than 0"],
        max: [10, "Semester number cannot exceed 10"],
        unique: true        //More than one entries with same semester nahi chalega.
    },
    semesterDetails: {
        type: [subjectDetailsSchema],
        default : []
    }
});
