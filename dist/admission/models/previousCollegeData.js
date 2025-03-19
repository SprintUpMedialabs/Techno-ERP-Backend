"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previousCollegeDataSchema = void 0;
const mongoose_1 = require("mongoose");
exports.previousCollegeDataSchema = new mongoose_1.Schema({
    collegeName: {
        type: String
    },
    district: {
        type: String
    },
    boardUniversity: {
        type: String
    },
    passingYear: {
        type: Number,
        validate: {
            validator: (year) => year.toString().length === 4,
            message: 'Passing Year must be a valid 4-digit year'
        }
    },
    aggregatePercentage: {
        type: Number,
        min: [0, 'Percentage must be at least 0'],
        max: [100, 'Percentage cannot exceed 100']
    }
});
