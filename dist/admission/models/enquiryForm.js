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
exports.Enquiry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const constants_1 = require("../../config/constants");
const enquiryApplicationIdSchema_1 = require("./enquiryApplicationIdSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const singleDocument_1 = require("./singleDocument");
const academicDetail_1 = require("./academicDetail");
const previousCollegeData_1 = require("./previousCollegeData");
const address_1 = require("./address");
const enquiryFormSchema = new mongoose_1.Schema({
    applicationId: {
        type: String,
        unique: true,
        // required: true,
        //We will not use required here as application Id is created in pre('save') hook so as order of execution the enquiry object is created first, which might fail as part of validation, the application ID is required which is created after the validations are done. Hence save is getting executed after validation, so we have the validator and not required as true.
        validate: {
            validator: function (value) {
                return !!value;
            },
            message: 'ApplicationId is required'
        },
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    studentName: {
        type: String,
        required: [true, 'Student Name is required']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value) => {
            console.log(value);
            let convertedDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
            console.log(convertedDate);
            if (!convertedDate)
                throw new Error('Invalid date format, expected DD-MM-YYYY');
            return convertedDate;
        }
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
    }
}, { timestamps: true });
const getPrefixForCourse = (course) => {
    if (course === constants_1.Course.MBA)
        return constants_1.ApplicationIdPrefix.TIMS;
    if (course === constants_1.Course.LLB)
        return constants_1.ApplicationIdPrefix.TCL;
    return constants_1.ApplicationIdPrefix.TIHS;
};
enquiryFormSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = this;
        // DTODO: just take a look at user [pre save middleware] first will check if course is modified or not. if its not modified then will skip this process. if its modified they will execute this. [will discuss it on call if required]
        if (doc) {
            const prefix = getPrefixForCourse(doc.course);
            // Find existing serial number for the prefix
            let serial = yield enquiryApplicationIdSchema_1.EnquiryApplicationId.findOne({ prefix: prefix });
            serial.lastSerialNumber += 1;
            // await serial.save(); => We will not do this here, as this can get updated even if validation of enquirySchema are failing, so we will update lastSerialNumber after the enquiry object is saved successfully.
            doc.applicationId = `${prefix}${serial.lastSerialNumber}`;
        }
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
enquiryFormSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
enquiryFormSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['date', 'dateOfBirth'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    // console.log("TRansforming date")
    return ret;
};
enquiryFormSchema.set('toJSON', { transform: transformDates });
enquiryFormSchema.set('toObject', { transform: transformDates });
exports.Enquiry = mongoose_1.default.model('Enquiry', enquiryFormSchema);
