"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.physicalDocumentNoteSchema = void 0;
const mongoose_1 = require("mongoose");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const constants_1 = require("../../config/constants");
exports.physicalDocumentNoteSchema = new mongoose_1.Schema({
    type: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(constants_1.PhysicalDocumentNoteStatus)
    },
    dueBy: {
        type: Date,
        required: false,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
});
