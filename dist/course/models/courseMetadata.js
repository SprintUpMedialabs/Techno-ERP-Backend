"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseMetaData = exports.courseModelSchema = exports.CourseStatus = exports.CourseType = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
var CourseType;
(function (CourseType) {
    CourseType["UG"] = "UG";
    CourseType["PG"] = "PG";
    CourseType["DIPLOMA"] = "Diploma";
})(CourseType || (exports.CourseType = CourseType = {}));
var CourseStatus;
(function (CourseStatus) {
    CourseStatus["RUNNING"] = "Running";
    CourseStatus["COMPLETED"] = "Completed";
    CourseStatus["INACTIVE"] = "Inactive";
})(CourseStatus || (exports.CourseStatus = CourseStatus = {}));
const FeeItemSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative'],
    },
}, { _id: false });
exports.courseModelSchema = new mongoose_1.Schema({
    departmentName: {
        type: String,
        required: [true, 'Department name is required'],
    },
    fullCourseName: {
        type: String,
        required: [true, 'Full course name is required'],
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
    },
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
    },
    collegeName: {
        type: String,
        required: [true, 'College name is required'],
    },
    type: {
        type: String,
        enum: Object.values(CourseType),
        required: [true, 'Course type is required'],
    },
    affiliation: {
        type: String,
        required: [true, 'Affiliation is required'],
    },
    status: {
        type: String,
        enum: Object.values(CourseStatus),
        required: [true, 'Status is required'],
    },
    courseDuration: {
        type: Number,
        required: [true, 'Course duration is required'],
        min: [1, 'Course duration must be at least 1 year'],
    },
    totalSemesters: {
        type: Number,
        required: [true, 'Total semesters are required'],
        min: [1, 'There must be at least 1 semester'],
    },
    documentType: {
        type: [String],
        default: [],
    },
    fee: {
        yearlyFee: {
            type: [FeeItemSchema],
            default: [],
        },
        semWiseFee: {
            type: [Number],
            default: [],
        },
        oneTime: {
            type: [FeeItemSchema],
            default: [],
        },
    },
    departmentMetaDataId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.DEPARTMENT_META_DATA
    }
}, { timestamps: true });
const transformDates = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.courseModelSchema.set('toJSON', { transform: transformDates });
exports.courseModelSchema.set('toObject', { transform: transformDates });
exports.CourseMetaData = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.COURSE_METADATA, exports.courseModelSchema);
