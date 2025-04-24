"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterModelSchema = void 0;
const mongoose_1 = require("mongoose");
const subject_1 = require("./subject");
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
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
const handleMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error);
    }
};
exports.semesterModelSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.semesterModelSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['actualDate', 'plannedDate'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.semesterModelSchema.set('toJSON', { transform: transformDates });
exports.semesterModelSchema.set('toObject', { transform: transformDates });
