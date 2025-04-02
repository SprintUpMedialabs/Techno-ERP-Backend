"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentFeesModel = exports.SingleSemWiseFeesSchema = exports.OtherFeesSchema = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
//Other fees schema
exports.OtherFeesSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.FeeType),
    },
    feeAmount: {
        type: Number,
    },
    finalFee: {
        type: Number,
    },
    feesDepositedTOA: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String
    }
});
//Sem wise schema
exports.SingleSemWiseFeesSchema = new mongoose_1.Schema({
    feeAmount: {
        type: Number,
    },
    finalFee: {
        type: Number,
    }
}, { _id: false });
//Fees draft for entire student
const StudentFeesSchema = new mongoose_1.Schema({
    otherFees: {
        type: [exports.OtherFeesSchema],
        validate: [
            (value) => value.length <= 50,
            'Cannot have more than 50 fee entries'
        ]
    },
    semWiseFees: {
        type: [exports.SingleSemWiseFeesSchema],
    },
    feeStatus: {
        type: String,
        enum: Object.values(constants_1.FeeStatus),
        default: constants_1.FeeStatus.DRAFT,
    },
    feesClearanceDate: {
        type: Date
    },
    counsellor: {
        type: mongoose_1.Schema.Types.Mixed, // Allows ObjectId or String
        validate: {
            validator: function (value) {
                // Allow null or undefined
                if (value === null || value === undefined)
                    return true;
                // Check for valid ObjectId
                const isObjectId = mongoose_1.Types.ObjectId.isValid(value);
                // Allow string 'other'
                const isOther = value === 'other';
                return isObjectId || isOther;
            },
            message: props => `'${props.value}' is not a valid counsellor (must be ObjectId or 'other')`
        },
        required: true,
    },
    approvedBy: {
        type: String,
        validate: {
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        },
    },
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
        next(error); // Pass any other errors to the next middleware
    }
};
StudentFeesSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
StudentFeesSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    ['feesClearanceDate'].forEach((key) => {
        if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
StudentFeesSchema.set('toJSON', { transform: transformDates });
StudentFeesSchema.set('toObject', { transform: transformDates });
exports.StudentFeesModel = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.STUDENT_FEE, StudentFeesSchema);
