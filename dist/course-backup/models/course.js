"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseSchema = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = require("mongoose");
const semester_1 = require("./semester");
exports.courseSchema = new mongoose_1.Schema({
    academicYear: {
        type: String,
        required: [true, "Academic year is required"],
        match: [/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)"]
    },
    courseCode: {
        type: String,
        required: [true, "Course code is required"]
    },
    courseName: {
        type: String,
        required: [true, "Course Name is required"],
    },
    collegeName: {
        type: String,
        required: [true, "College name is required"],
        minlength: [3, "College name must be at least 3 characters long"],
        maxlength: [100, "College name must be at most 100 characters long"]
    },
    totalSemesters: {
        type: Number,
        required: [true, "Total number of semesters is required"],
        min: [1, "At least one semester is required"],
    },
    semester: {
        type: [semester_1.semesterSchema],
        default: [],
    }
}, {
    timestamps: true
});
const handleMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw (0, http_errors_1.default)(400, "Course with this courseCode already exists"); //If course would be duplicated in department, this error would handle that
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error);
    }
};
exports.courseSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.courseSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.courseSchema.set('toJSON', { transform: transformDates });
exports.courseSchema.set('toObject', { transform: transformDates });
