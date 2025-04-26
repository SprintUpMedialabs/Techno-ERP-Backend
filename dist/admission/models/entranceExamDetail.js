"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entranceExamDetailSchema = void 0;
const mongoose_1 = require("mongoose");
exports.entranceExamDetailSchema = new mongoose_1.Schema({
    nameOfExamination: {
        type: String
    },
    rollNumber: {
        type: String
    },
    rank: {
        type: Number
    },
    qualified: {
        type: Boolean
    }
});
