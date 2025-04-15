"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterSchema = void 0;
const mongoose_1 = require("mongoose");
const subject_1 = require("./subject");
const http_errors_1 = __importDefault(require("http-errors"));
exports.semesterSchema = new mongoose_1.Schema({
    semesterNumber: {
        type: Number,
        required: [true, "Semester number is required"],
        min: [1, "Semester number must be greater than 0"],
        max: [10, "Semester number cannot exceed 10"],
    },
    subjectDetails: {
        type: [subject_1.subjectDetailsSchema],
        default: [],
    },
});
const handleMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        console.log(firstError.message);
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw (0, http_errors_1.default)(400, "Semester with this semester details already exists");
    }
    else if (error.name == 'MongooseError') {
        console.log(error.message);
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error);
    }
};
exports.semesterSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.semesterSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.semesterSchema.set('toJSON', { transform: transformDates });
exports.semesterSchema.set('toObject', { transform: transformDates });
