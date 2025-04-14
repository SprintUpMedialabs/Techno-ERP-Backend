"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterModelSchema = void 0;
const mongoose_1 = require("mongoose");
const subject_1 = require("./subject");
;
exports.semesterModelSchema = new mongoose_1.Schema({
    semesterNumber: { type: Number, required: true },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}-\d{4}$/,
    },
    subjects: {
        type: [subject_1.subjectModelSchema],
        default: []
    }
});
