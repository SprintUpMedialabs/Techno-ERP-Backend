"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseAndOtherFeesModel = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../config/constants");
// Course Fee Schema
const CourseFeeSchema = new mongoose_1.Schema({
    course: {
        type: String,
        // enum: {
        //     values: Object.values(Course),
        //     message: 'Invalid Course value'
        // },
        required: true
    },
    fee: {
        type: [Number], // adjust if it's an object
        required: true
    }
}, { _id: false });
// Other Fee Schema
const OtherFeeSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true
    },
    fee: {
        type: Number,
        required: true
    }
}, { _id: false });
// Main Schema
const CourseAndOtherFeesSchema = new mongoose_1.Schema({
    courseFees: {
        type: [CourseFeeSchema],
    },
    otherFees: {
        type: [OtherFeeSchema],
    }
}, { timestamps: true });
// Model
exports.CourseAndOtherFeesModel = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.COURSE_OTHER_FEES, CourseAndOtherFeesSchema);
