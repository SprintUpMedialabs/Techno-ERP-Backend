import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAMES } from "../constants";

interface ITechnoMetaData extends Document{
    name : string;
    value : number;
}

const TechnoMetaDataSchema = new Schema<ITechnoMetaData>({
    name : {
        type : String,
        required : true,
        unique : true
    },
    value : {
        type : Number,
        required : true
    }
})

export const TechnoMetaData = mongoose.model<ITechnoMetaData>(COLLECTION_NAMES.TECHNO_META_DATA, TechnoMetaDataSchema)