"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicDetailFormSchema = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
exports.academicDetailFormSchema = new mongoose_1.Schema({
    academicDetails: {
        type: String,
        enum: Object.values(constants_1.AcademicDetails)
    },
    schoolCollegeName: {
        type: String
    },
    universityBoardName: {
        type: String
    },
    passingYear: {
        type: Number,
        validate: {
            validator: (year) => year.toString().length === 4,
            message: 'Passing Year must be a valid 4-digit year'
        }
    },
    percentageObtained: {
        type: Number,
        min: [0, 'Percentage must be at least 0'],
        max: [100, 'Percentage cannot exceed 100']
    },
    subjects: {
        type: [String]
    }
});
