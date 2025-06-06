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
exports.isOlderThan7Days = isOlderThan7Days;
const http_errors_1 = __importDefault(require("http-errors"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const leadSchema = new mongoose_1.Schema({
    // Change format to DD/MM/YYYY and add error message
    date: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value) => { return (0, convertDateToFormatedDate_1.convertToMongoDate)(value); }
    },
    source: {
        type: String,
        trim: true,
    },
    schoolName: {
        type: String,
        trim: true,
    },
    // Accepts only alphabets (both uppercase and lowercase) and spaces
    name: {
        type: String,
        trim: true,
        // required: [true, 'Name is required'],
        // match: [/^[A-Za-z\s]+$/, 'Name can only contain alphabets and spaces'],
    },
    // Must be a unique Indian phone number (+91 followed by 10 digits)
    phoneNumber: {
        type: String,
        trim: true,
        // required: [true, 'Phone Number is required'],
        // unique: [true, 'Phone Number already exists'],
        // match: [/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890'],
    },
    // Optional alternate phone number; must follow the same format as phoneNumber
    remarkUpdatedAt: {
        type: Date,
        default: null
    },
    altPhoneNumber: {
        type: String,
        trim: true,
        // match: [/^[1-9]\d{9}$/, 'Invalid contact number format. Expected: 1234567890']
    },
    // Email validation using regex
    email: {
        type: String,
        trim: true,
        // match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
    },
    // Optional gender field that must be one of the predefined enum values
    gender: {
        type: String,
        trim: true,
        enum: {
            values: Object.values(constants_1.Gender),
            message: 'Invalid gender value'
        }
    },
    area: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        trim: true,
    },
    course: {
        type: String,
        trim: true,
    },
    degree: {
        type: String,
        trim: true,
    },
    // ✅ Modified from array to single ObjectId
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
        required: true,
    },
    // Must be one of the predefined lead types; defaults to "ORANGE"
    leadType: {
        type: String,
        trim: true,
        enum: {
            values: Object.values(constants_1.LeadType),
            message: 'Invalid lead type'
        },
        default: constants_1.LeadType.LEFT_OVER
    },
    remarks: {
        type: [String],
        default: [],
    },
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
    followUpCount: {
        type: Number,
        default: 0
    },
    isActiveLead: {
        type: Boolean,
        default: false
    },
    isCalledToday: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
leadSchema.index({ source: 1, name: 1, phoneNumber: 1, assignedTo: 1 }, { unique: true, name: 'unique_lead_combo' });
const handleMongooseError = (error, leadData, next) => {
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
    handleMongooseError(error, doc, next);
});
leadSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, doc, next);
});
const transformDates = (_, ret) => {
    ['leadTypeModifiedDate', 'nextDueDate', 'date', 'updatedAt'].forEach((key) => {
        if (key == 'updatedAt') {
            if (ret[key]) {
                ret[key] = (0, moment_timezone_1.default)(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY | HH:mm');
            }
        }
        else if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    if (ret.remarkUpdatedAt) {
        ret.isOlderThan7Days = isOlderThan7Days(ret.remarkUpdatedAt);
        ret.lastCallDate = (0, moment_timezone_1.default)(ret.remarkUpdatedAt).tz('Asia/Kolkata').format('DD/MM/YYYY | HH:mm');
    }
    else {
        ret.isOlderThan7Days = true;
        ret.lastCallDate = null;
    }
    delete ret.createdAt;
    delete ret.__v;
    return ret;
};
function isOlderThan7Days(remarkUpdatedAt) {
    const sevenDaysAgo = moment_timezone_1.default.tz('Asia/Kolkata').subtract(7, 'days').startOf('day');
    return (0, moment_timezone_1.default)(remarkUpdatedAt).isBefore(sevenDaysAgo);
}
leadSchema.set('toJSON', { transform: transformDates });
leadSchema.set('toObject', { transform: transformDates });
exports.LeadMaster = mongoose_1.default.model(constants_1.COLLECTION_NAMES.LEAD, leadSchema);
