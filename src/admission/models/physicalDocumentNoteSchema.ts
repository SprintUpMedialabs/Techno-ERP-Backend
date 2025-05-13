import { Schema } from "mongoose";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { PhysicalDocumentNoteStatus } from "../../config/constants";
import { IPhysicalDocumentNoteSchema } from "../validators/physicalDocumentNoteSchema";

export interface IPhysicalDocumentNoteSchemaDoc extends IPhysicalDocumentNoteSchema, Document { }

export const physicalDocumentNoteSchema = new Schema<IPhysicalDocumentNoteSchemaDoc>({
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


