import { Schema } from "mongoose";
import { ISemesterSchema } from "../validators/semesterSchema";
import { subjectModelSchema } from "./subject";

export interface ISemesterDocument extends ISemesterSchema, Document {};

export const semesterModelSchema = new Schema<ISemesterDocument>({
    semesterNumber: { type: Number, required: true },
    academicYear: {
      type: String,
      required: true,
      match: /^\d{4}-\d{4}$/,
    },
    subjects: {
        type : [subjectModelSchema],
        default : []
    }
})
  