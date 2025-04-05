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
exports.StudentFeesDraftModel = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const studentFees_1 = require("./studentFees");
const StudentFeesDraftSchema = new mongoose_1.Schema({
    otherFees: {
        type: [studentFees_1.OtherFeesSchema],
        validate: [
            (value) => value.length <= 50,
            'Cannot have more than 50 fee entries'
        ],
        required: false
    },
    semWiseFees: {
        type: [studentFees_1.SingleSemWiseFeesSchema],
        required: false
    },
    feeStatus: {
        type: String,
        enum: Object.values(constants_1.FeeStatus),
        default: constants_1.FeeStatus.DRAFT,
        required: false
    },
    feesClearanceDate: {
        type: Date,
        required: false
    },
    counsellor: {
        type: [mongoose_1.Schema.Types.Mixed],
        validate: {
            validator: function (values) {
                if (!Array.isArray(values))
                    return false;
                return values.every(value => {
                    if (value === null || value === undefined)
                        return true;
                    const isObjectId = mongoose_1.default.Types.ObjectId.isValid(value);
                    const isOther = value === 'other';
                    return isObjectId || isOther;
                });
            },
            message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'other')`
        }
    },
    telecaller: {
        type: [mongoose_1.Schema.Types.Mixed],
        validate: {
            validator: function (values) {
                if (!Array.isArray(values))
                    return false;
                return values.every(value => {
                    if (value === null || value === undefined)
                        return true;
                    const isObjectId = mongoose_1.default.Types.ObjectId.isValid(value);
                    const isOther = value === 'other';
                    return isObjectId || isOther;
                });
            },
            message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'other')`
        }
    },
    remarks: {
        type: String
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
        next(error); // Pass any other errors to the next middleware
    }
};
StudentFeesDraftSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
StudentFeesDraftSchema.post('findOneAndUpdate', function (error, doc, next) {
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
StudentFeesDraftSchema.set('toJSON', { transform: transformDates });
StudentFeesDraftSchema.set('toObject', { transform: transformDates });
exports.StudentFeesDraftModel = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.STUDENT_FEE_DRAFT, StudentFeesDraftSchema);
