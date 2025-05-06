"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleDocumentSchema = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.singleDocumentSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.DocumentType)
    },
    fileUrl: {
        type: String,
    },
    dueBy: {
        type: Date,
        required: false,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
});
