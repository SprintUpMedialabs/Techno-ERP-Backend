"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleModelSchema = exports.planModelSchema = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const http_errors_1 = __importDefault(require("http-errors"));
;
;
exports.planModelSchema = new mongoose_1.Schema({
    unit: {
        type: Number,
        required: [true, 'Unit Number is required.'],
        min: [0, 'Unit Number must be a valid value.']
    },
    lectureNumber: {
        type: Number,
        required: [true, 'Lecture Number is required.'],
        min: [0, 'Lecture number must be a valid value.']
    },
    topicName: {
        type: String,
        required: [true, 'Topic Name is required.']
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
    },
    plannedDate: {
        type: Date,
        required: [true, 'Planned Date is required'],
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    actualDate: {
        type: Date,
        set: (value) => {
            return value ? (0, convertDateToFormatedDate_1.convertToMongoDate)(value) : undefined;
        },
    },
    classStrength: {
        type: Number,
    },
    attendance: {
        type: Number,
        validate: {
            validator: function (value) {
                if (value === undefined || this.classStrength === undefined) {
                    return true;
                }
                return value <= this.classStrength;
            },
            message: "Attendance cannot exceed class strength",
        },
    },
    absent: {
        type: Number
    },
    confirmation: {
        type: String,
        enum: {
            values: Object.values(constants_1.LectureConfirmation),
            message: 'Invalid Confirmation Value'
        },
        default: constants_1.LectureConfirmation.TO_BE_DONE,
    },
    remarks: {
        type: String
    },
    documents: [
        {
            type: String
        }
    ],
});
exports.scheduleModelSchema = new mongoose_1.Schema({
    lecturePlan: [exports.planModelSchema],
    practicalPlan: [exports.planModelSchema],
    additionalResources: [{ type: String }],
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
exports.scheduleModelSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.scheduleModelSchema.post('findOneAndUpdate', function (error, doc, next) {
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
exports.scheduleModelSchema.set('toJSON', { transform: transformDates });
exports.scheduleModelSchema.set('toObject', { transform: transformDates });
