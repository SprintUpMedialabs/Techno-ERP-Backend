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
        },
        required: false,
        default: constants_1.AdmissionMode.OFFLINE
    },
    dateOfEnquiry: {
        type: Date,
        default: new Date(),
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        },
        required: false
    },
    studentName: {
        type: String,
        required: true
    },
    studentPhoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Phone Number'
        },
    },
    emailId: {
        type: String,
        validate: {
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        },
        required: false
    },
    fatherName: {
        type: String,
        required: false
    },
    fatherPhoneNumber: {
        type: String,
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Father Phone Number'
        },
        required: false
    },
    fatherOccupation: {
        type: String,
        required: false
    },
    motherName: {
        type: String,
        required: false
    },
    motherPhoneNumber: {
        type: String,
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Mother Phone Number'
        },
        required: false
    },
    motherOccupation: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        set: (value) => {
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        },
        required: false
    },
    category: {
        type: String,
        enum: {
            values: Object.values(constants_1.Category),
            message: 'Invalid Category value'
        },
        required: false
    },
    course: {
        type: String,
        enum: {
            values: Object.values(constants_1.Course),
            message: 'Invalid Course value'
        },
        required: false
    },
    reference: {
        type: String,
        enum: {
            values: Object.values(constants_1.AdmissionReference),
            message: 'Invalid Admission Reference value'
        },
        required: false
    },
    address: {
        type: address_1.addressSchema,
        minlength: [5, 'Address must be at least 5 characters long'],
        required: false
    },
    academicDetails: {
        type: [academicDetail_1.academicDetailFormSchema],
        default: [],
        required: false
    },
    // DTODO: here we have id and other 2 value [so type should be according to that]
    counsellor: {
        type: [mongoose_1.Schema.Types.Mixed], // Allows ObjectId or String
        validate: {
            validator: function (values) {
                if (!Array.isArray(values))
                    return false; // Ensure it's an array
                return values.every(value => {
                    // Allow null or undefined
                    if (value === null || value === undefined)
                        return true;
                    // Check for valid ObjectId
                    const isObjectId = mongoose_1.default.Types.ObjectId.isValid(value);
                    // Allow string 'other'
                    const isOther = value === 'other';
                    return isObjectId || isOther;
                });
            },
            message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'other')`
        },
        required: false,
    },
    // DTODO: here we have id and other 2 value [so type should be according to that]
    // this change need to be done in other models [studentFeesDraft, studentFees, enquiry]
    telecaller: {
        type: [mongoose_1.Schema.Types.Mixed], // Allows ObjectId or String
        validate: {
            validator: function (values) {
                if (!Array.isArray(values))
                    return false; // Ensure it's an array
                return values.every(value => {
                    // Allow null or undefined
                    if (value === null || value === undefined)
                        return true;
                    // Check for valid ObjectId
                    const isObjectId = mongoose_1.default.Types.ObjectId.isValid(value);
                    // Allow string 'other'
                    const isOther = value === 'other';
                    return isObjectId || isOther;
                });
            },
            message: props => `'${props.value}' contains an invalid telecaller (must be ObjectId or 'other')`
        },
        required: false,
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
    applicationStatus: {
        type: String,
        enum: {
            values: Object.values(constants_1.ApplicationStatus),
            message: 'Invalid Application Status value'
        },
        default: constants_1.ApplicationStatus.STEP_1,
        required: true
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
    ['dateOfEnquiry', 'dateOfBirth'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.enquiryDraftSchema.set('toJSON', { transform: transformDates });
exports.enquiryDraftSchema.set('toObject', { transform: transformDates });
exports.EnquiryDraft = mongoose_1.default.model(constants_1.COLLECTION_NAMES.ENQUIRY_DRAFT, exports.enquiryDraftSchema);
