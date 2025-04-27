import { Schema } from "mongoose";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { PhysicalDocumentNoteStatus } from "../../config/constants";

export const physicalDocumentNoteSchema = new Schema({
    type: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(PhysicalDocumentNoteStatus)
    },
    dueBy: {
        type: Date,
        required: false,
        set: (value: string) => {
            return convertToMongoDate(value);
        }
    },
});