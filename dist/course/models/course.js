"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const semester_1 = require("./semester");
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
;
const courseModelSchema = new mongoose_1.Schema({
    courseName: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseFullName: { type: String, required: true },
    collegeName: { type: String, required: true },
    departmentMetaDataId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.DEPARTMENT_META_DATA
    },
    startingYear: {
        type: Number,
        required: true,
        min: [1000, "Starting year must be a valid 4-digit year"],
        max: [9999, "Starting year must be a valid 4-digit year"],
    },
    totalSemesters: {
        type: Number
    },
    semester: {
        type: [semester_1.semesterModelSchema],
        default: []
    }
}, { timestamps: true });
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
courseModelSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
courseModelSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
// DTODO: do you think that we will get this actualDate and plannedDate in the response?
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
courseModelSchema.set('toJSON', { transform: transformDates });
courseModelSchema.set('toObject', { transform: transformDates });
exports.Course = mongoose_1.default.model(constants_1.COLLECTION_NAMES.COURSE, courseModelSchema);
