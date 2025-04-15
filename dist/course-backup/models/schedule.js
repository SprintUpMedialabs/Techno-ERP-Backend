"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleSchema = void 0;
const mongoose_1 = require("mongoose");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const http_errors_1 = __importDefault(require("http-errors"));
exports.scheduleSchema = new mongoose_1.Schema({
    lectureNumber: {
        type: Number,
        min: [1, "Lecture number must be greater than 0"],
    },
    topicName: {
        type: String,
        minlength: [3, "Topic name must be at least 3 characters long"],
        maxlength: [100, "Topic name must be at most 100 characters long"]
    },
    description: {
        type: String,
        maxlength: [500, "Description must be at most 500 characters long"]
    },
    plannedDate: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    dateOfLecture: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    confirmation: {
        type: Boolean,
    },
    remarks: {
        type: String,
        maxlength: [200, "Remarks must be at most 200 characters long"]
    }
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
exports.scheduleSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.scheduleSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['plannedDate', 'dateOfLecture'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.scheduleSchema.set('toJSON', { transform: transformDates });
exports.scheduleSchema.set('toObject', { transform: transformDates });
