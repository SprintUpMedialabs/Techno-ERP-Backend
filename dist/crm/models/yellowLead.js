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
exports.YellowLead = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const http_errors_1 = __importDefault(require("http-errors"));
const logger_1 = __importDefault(require("../../config/logger"));
const yellowLeadSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, 'Lead Type Change Date is required'],
        $set: (value) => (0, convertDateToFormatedDate_1.convertToMongoDate)(value)
    },
    name: { type: String, required: [true, 'Name is required'] },
    phoneNumber: {
        type: String,
        required: [true, 'Phone no is required'],
        unique: [true, 'Phone no already exists'],
        match: [/^\d{10}$/, 'Invalid phone number format, expected: 10 digits']
    },
    altPhoneNumber: {
        type: String,
        match: [/^\d{10}$/, 'Invalid phone number format, expected: 10 digits']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    gender: { type: String, enum: Object.values(constants_1.Gender), default: constants_1.Gender.NOT_TO_MENTION },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, required: [true, 'Assigned To Field is required'] },
    location: { type: String },
    course: { type: String },
    campusVisit: { type: Boolean, default: false },
    nextDueDate: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    finalConversion: { type: String, enum: Object.values(constants_1.FinalConversionType) },
    remarks: { type: String }
}, { timestamps: true });
const handleMongooseError = (error, next) => {
    logger_1.default.error(error);
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
yellowLeadSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
yellowLeadSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
yellowLeadSchema.post('findOne', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    logger_1.default.debug("we are here");
    ['nextDueDate', 'date', 'createdAt'].forEach((key) => {
        if (ret[key]) {
            if (key == 'createdAt') {
                ret['ltcDate'] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
            }
            else {
                ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
            }
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
yellowLeadSchema.set('toJSON', { transform: transformDates });
yellowLeadSchema.set('toObject', { transform: transformDates });
exports.YellowLead = mongoose_1.default.model('YellowLead', yellowLeadSchema);
