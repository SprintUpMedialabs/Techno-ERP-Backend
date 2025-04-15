"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectDetailsSchema = void 0;
const mongoose_1 = require("mongoose");
const schedule_1 = require("./schedule");
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
exports.subjectDetailsSchema = new mongoose_1.Schema({
    subjectName: {
        type: String,
        required: [true, "Subject name is required"],
        minlength: [3, "Subject name must be at least 3 characters long"],
        maxlength: [100, "Subject name must be at most 100 characters long"],
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
        required: [true, "Instructor information is required"],
    },
    subjectCode: {
        type: String,
        required: [true, "Subject code is required"],
        minlength: [3, "Subject code must be at least 3 characters long"],
        maxlength: [10, "Subject code must be at most 10 characters long"]
    },
    schedule: {
        type: [schedule_1.scheduleSchema],
        default: []
    }
});
const handleMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.code === 11000) {
        throw (0, http_errors_1.default)(400, "Department with this department details already exists"); //If course would be duplicated in department, this error would handle that
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error);
    }
};
exports.subjectDetailsSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.subjectDetailsSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.subjectDetailsSchema.set('toJSON', { transform: transformDates });
exports.subjectDetailsSchema.set('toObject', { transform: transformDates });
