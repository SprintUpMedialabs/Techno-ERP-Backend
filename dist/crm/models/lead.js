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
exports.LeadMaster = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const leadSchema = new mongoose_1.Schema({
    // Change format to DD/MM/YYYY and add error message
    date: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value) => { return (0, convertDateToFormatedDate_1.convertToMongoDate)(value); }
    },
    source: {
        type: String,
    },
    schoolName: {
        type: String,
    },
    // Accepts only alphabets (both uppercase and lowercase) and spaces
    name: {
        type: String,
        required: [true, 'Name is required'],
        match: [/^[A-Za-z\s]+$/, 'Name can only contain alphabets and spaces'],
    },
    // Must be a unique Indian phone number (+91 followed by 10 digits)
    phoneNumber: {
        type: String,
        required: [true, 'Phone Number is required'],
        // unique: [true, 'Phone Number already exists'],
        match: [/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890'],
    },
    // Optional alternate phone number; must follow the same format as phoneNumber
    altPhoneNumber: {
        type: String,
        match: [/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890']
    },
    // Email validation using regex
    email: {
        type: String,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    // Optional gender field that must be one of the predefined enum values
    gender: {
        type: String,
        enum: {
            values: Object.values(constants_1.Gender),
            message: 'Invalid gender value'
        }
    },
    area: {
        type: String,
    },
    city: {
        type: String,
    },
    course: {
        type: String,
        enum: {
            values: Object.values(constants_1.Course),
            message: 'Invalid Course Value'
        }
    },
    // Required field with a custom validation error message
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Assigned To is required']
    },
    // Must be one of the predefined lead types; defaults to "ORANGE"
    leadType: {
        type: String,
        enum: {
            values: Object.values(constants_1.LeadType),
            message: 'Invalid lead type'
        },
        default: constants_1.LeadType.OPEN
    },
    remarks: { type: String },
    leadTypeModifiedDate: { type: Date },
    nextDueDate: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    footFall: { type: Boolean, default: false },
    finalConversion: {
        type: String, enum: Object.values(constants_1.FinalConversionType),
        default: constants_1.FinalConversionType.NO_FOOTFALL
    },
    leadsFollowUpCount: {
        type: Number,
        default: 0
    },
    yellowLeadsFollowUpCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
leadSchema.index({ source: 1, name: 1, phoneNumber: 1 }, { unique: true, name: 'unique_lead_combo' });
const handleMongooseError = (error, next) => {
    if (error.code === 11000) {
        throw (0, http_errors_1.default)(400, 'Phone Number already exists');
    }
    else if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error); // Pass any other errors to the next middleware
    }
};
leadSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
leadSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['leadTypeModifiedDate', 'nextDueDate', 'date'].forEach((key) => {
        if (key == 'leadTypeModifiedDate') {
            if (ret[key]) {
                ret[key] = (0, moment_timezone_1.default)(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY | HH:mm');
            }
        }
        else if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
leadSchema.set('toJSON', { transform: transformDates });
leadSchema.set('toObject', { transform: transformDates });
exports.LeadMaster = mongoose_1.default.model(constants_1.COLLECTION_NAMES.LEAD, leadSchema);
