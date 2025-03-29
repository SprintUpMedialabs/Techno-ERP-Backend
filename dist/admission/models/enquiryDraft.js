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
exports.EnquiryDraft = exports.enquiryDraftSchema = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importStar(require("mongoose"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const constants_1 = require("../../config/constants");
const commonSchema_1 = require("../../validators/commonSchema");
const academicDetail_1 = require("./academicDetail");
const address_1 = require("./address");
exports.enquiryDraftSchema = new mongoose_1.Schema({
    admissionMode: {
        type: String,
        enum: {
            values: Object.values(constants_1.AdmissionMode),
            message: 'Invalid Admission Mode value'
        }
    },
    dateOfEnquiry: {
        type: Date,
        required: true,
        default: new Date(),
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    studentName: {
        type: String,
        required: [true, 'Student Name is required']
    },
    studentPhoneNumber: {
        type: String,
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Phone Number'
        }
    },
    emailId: {
        type: String,
        validate: {
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        }
    },
    fatherName: {
        type: String,
        required: [true, "Father's Name is required"]
    },
    fatherPhoneNumber: {
        type: String,
        required: [true, 'Father Phone Number is required.'],
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Father Phone Number'
        }
    },
    fatherOccupation: {
        type: String,
        required: [true, 'Father occupation is required']
    },
    motherName: {
        type: String,
        required: [true, "Mother's Name is required"]
    },
    motherPhoneNumber: {
        type: String,
        required: [true, 'Mother Phone Number is required.'],
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Mother Phone Number'
        }
    },
    motherOccupation: {
        type: String,
        required: [true, 'Mother occupation is required']
    },
    dateOfBirth: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    category: {
        type: String,
        enum: {
            values: Object.values(constants_1.Category),
            message: 'Invalid Category value'
        }
    },
    course: {
        type: String,
        enum: {
            values: Object.values(constants_1.Course),
            message: 'Invalid Course value'
        },
    },
    reference: {
        type: String,
        enum: {
            values: Object.values(constants_1.AdmissionReference),
            message: 'Invalid Admission Reference value'
        },
    },
    address: {
        type: address_1.addressSchema,
        minlength: [5, 'Address must be at least 5 characters long']
    },
    academicDetails: {
        type: [academicDetail_1.academicDetailFormSchema],
        default: [],
        required: false
    },
    counsellorName: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false
    },
    telecallerName: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false
    },
    dateOfCounselling: {
        type: Date,
        required: false,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    remarks: {
        type: String
    },
    gender: {
        type: String,
        enum: {
            values: Object.values(constants_1.Gender),
            message: 'Invalid gender value'
        }
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false
    },
}, { timestamps: true });
const handleDraftMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else {
        next(error);
    }
};
exports.enquiryDraftSchema.post('save', function (error, doc, next) {
    handleDraftMongooseError(error, next);
});
exports.enquiryDraftSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleDraftMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['dateOfEnquiry', 'dateOfBirth', 'dateOfCounselling'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    return ret;
};
exports.enquiryDraftSchema.set('toJSON', { transform: transformDates });
exports.enquiryDraftSchema.set('toObject', { transform: transformDates });
exports.EnquiryDraft = mongoose_1.default.model('EnquiryDraft', exports.enquiryDraftSchema);
