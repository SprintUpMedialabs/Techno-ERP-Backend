import { Schema } from "mongoose";
import { IEntranceExamDetailSchema } from "../validators/entranceExamDetailSchema";

export interface IEntranceExamDetailDocument extends IEntranceExamDetailSchema, Document {}

export const entranceExamDetailSchema = new Schema<IEntranceExamDetailDocument>({
    nameOfExamination : {
        type : String
    },
    rollNumber : {
        type : String
    },
    rank : {
        type : Number
    },
    qualified : {
        type : Boolean
    }
});
