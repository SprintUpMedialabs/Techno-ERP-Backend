import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAMES } from "../../config/constants";

export const collegeMetaDataSchema = new Schema({
    collegeName: { type: String },
    fullCollegeName: { type: String },
    affiliation: { type: String },
    fullAffiliation: { type: String },
    websiteLink: { type: String },
    collegeEmail: { type: String },
    collegeContact: { type: String }
});

export const CollegeMetaData = mongoose.model(COLLECTION_NAMES.COLLEGE_META_DATA, collegeMetaDataSchema);