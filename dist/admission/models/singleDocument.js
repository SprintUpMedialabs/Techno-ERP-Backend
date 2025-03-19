"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleDocumentSchema = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
exports.singleDocumentSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.DocumentType)
    },
    fileUrl: {
        type: String
    }
});
