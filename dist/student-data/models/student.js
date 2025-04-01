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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const address_1 = require("../../admission/models/address");
const academicDetail_1 = require("../../admission/models/academicDetail");
const singleDocument_1 = require("../../admission/models/singleDocument");
const previousCollegeData_1 = require("../../admission/models/previousCollegeData");
const studentSchema = new mongoose_1.Schema({
    universityId: {
        type: String,
    },
    photoNo: {
        type: Number,
    },
    formNo: {
        type: String,
    },
    dateOfEnquiry: {
        type: Date,
        required: true,
        default: new Date(), // DA Check : This won't come from input hence initialised it to new date.
    },
    dateOfAdmission: {
        type: Date,
    },
    admissionMode: {
        type: String,
        enum: {
            values: Object.values(constants_1.AdmissionMode),
            message: 'Invalid Admission Mode value'
        }
    },
    studentName: {
        type: String,
        required: [true, 'Student Name is required']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date is required'],
        // set: (value: string) => {
        //   let convertedDate = convertToMongoDate(value);
        //   if (!convertedDate) throw createHttpError(400,'Invalid date format, expected DD-MM-YYYY');
        //   return convertedDate;
        // }
    },
    studentPhoneNumber: {
        type: String,
        validate: {
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
            message: 'Invalid Phone Number'
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
    category: {
        type: String,
        enum: {
            values: Object.values(constants_1.Category),
            message: 'Invalid Category value'
        },
        required: true
    },
    address: {
        type: address_1.addressSchema,
        required: [true, 'Address is required'],
        minlength: [5, 'Address must be at least 5 characters long']
    },
    emailId: {
        type: String,
        validate: {
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        }
    },
    reference: {
        type: String,
        enum: {
            values: Object.values(constants_1.AdmissionReference),
            message: 'Invalid Admission Reference value'
        },
        required: true
    },
    course: {
        type: String,
        enum: {
            values: Object.values(constants_1.Course),
            message: 'Invalid Course value'
        },
        required: true
    },
    remarks: {
        type: String
    },
    academicDetails: {
        type: [academicDetail_1.academicDetailFormSchema],
        default: []
    },
    previousCollegeData: {
        type: previousCollegeData_1.previousCollegeDataSchema
    },
    documents: {
        type: [singleDocument_1.singleDocumentSchema]
    },
    studentFee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'studentFee', // Refer to FeesDraft model
        optional: true
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
            message: 'Invalid Course value'
        },
        required: true
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        optional: true
    },
    preRegNumber: {
        type: String,
        optional: true
    },
    counsellor: {
        type: mongoose_1.Schema.Types.Mixed,
        validate: {
            validator: function (value) {
                return (value === 'other' ||
                    mongoose_1.Types.ObjectId.isValid(value));
            },
            message: 'Counsellor must be a valid ObjectId or "other"',
        },
    },
    admittedThrough: {
        type: String,
        enum: Object.values(constants_1.AdmittedThrough)
    },
    semester: {
        type: String
    }
}, { timestamps: true });
studentSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        next();
    });
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
        next(error); // Pass any other errors to the next middleware
    }
};
studentSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
studentSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['dateOfEnquiry', 'dateOfAdmission', 'dateOfBirth'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    return ret;
};
studentSchema.set('toJSON', { transform: transformDates });
studentSchema.set('toObject', { transform: transformDates });
exports.Student = mongoose_1.default.model('Student', studentSchema);
