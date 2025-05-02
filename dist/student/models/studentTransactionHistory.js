"use strict";
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
exports.StudentTransactionModel = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const http_errors_1 = __importDefault(require("http-errors"));
const BaseTransactionModel = new mongoose_1.Schema({
    transactionID: {
        type: Number,
        required: true,
    },
    dateTime: {
        type: Date,
        set: (value) => value ? (0, convertDateToFormatedDate_1.convertToMongoDate)(value) : undefined
    },
    feeAction: {
        type: String,
        enum: Object.values(constants_1.FeeActions),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    txnType: {
        type: String,
        enum: Object.values(constants_1.TransactionTypes),
        required: true,
    },
    remark: {
        type: String,
    },
});
exports.StudentTransactionModel = new mongoose_1.Schema({
    studentId: {
        type: String,
        required: true,
    },
    transactions: {
        type: [BaseTransactionModel],
        required: true,
        default: [],
    },
}, { timestamps: true });
exports.StudentTransactionModel.pre('save', function (next) {
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
        next(error);
    }
};
exports.StudentTransactionModel.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.StudentTransactionModel.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const removeExtraInfo = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.StudentTransactionModel.set('toJSON', { transform: removeExtraInfo });
exports.StudentTransactionModel.set('toObject', { transform: removeExtraInfo });
// export const StudentTransaction = mongoose.model<IStudentTransactionDocument>(COLLECTION_NAMES.STUDENT_TRANSACTION_HISTORY, StudentTransactionModel);
