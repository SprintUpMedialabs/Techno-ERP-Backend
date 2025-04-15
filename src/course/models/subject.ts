import mongoose, { Schema } from "mongoose";
import { ISubjectSchema } from "../validators/subjectSchema";
import { COLLECTION_NAMES } from "../../config/constants";
import { scheduleModelSchema } from "./schedule";

export interface ISubjectDocument extends ISubjectSchema, Document {};

export const subjectModelSchema = new Schema<ISubjectDocument>({
    subjectName: {
        type: String,
        required: [true, "Subject Name is required."],
    },
    subjectCode: {
        type: String,
        required: [true, "Subject Code is required."],
    },
    instructor: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: COLLECTION_NAMES.USER
        }
    ],
    schedule : {
        type : scheduleModelSchema,
        default : {}
    }
});

