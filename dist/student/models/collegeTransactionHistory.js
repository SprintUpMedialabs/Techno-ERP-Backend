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
exports.CollegeTransaction = exports.CollegeTransactionModel = exports.TransactionSettlementHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
const TechnoMetaData_1 = require("../../config/models/TechnoMetaData");
exports.TransactionSettlementHistory = new mongoose_1.Schema({
    name: {
        type: String
    },
    amount: {
        type: Number
    }
}, { _id: false });
exports.CollegeTransactionModel = new mongoose_1.Schema({
    studentId: {
        type: String,
        required: true,
    },
    dateTime: {
        type: Date,
        default: new Date()
    },
    feeAction: {
        type: String,
        enum: Object.values(constants_1.FeeActions),
        required: true,
    },
    transactionID: {
        type: Number,
        // required: true,
        unique: true,
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
    actionedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER
    },
    courseName: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        required: true
    },
    transactionSettlementHistory: {
        type: [exports.TransactionSettlementHistory],
        default: []
    }
}, { timestamps: true });
exports.CollegeTransactionModel.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isNew) {
            return next();
        }
        try {
            const counter = yield TechnoMetaData_1.TechnoMetaData.findOneAndUpdate({ name: "transactionID" }, { $inc: { value: 1 } }, { upsert: true, new: true });
            this.transactionID = counter.value;
            next();
        }
        catch (err) {
            next(err);
        }
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
exports.CollegeTransactionModel.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.CollegeTransactionModel.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const removeExtraInfo = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.CollegeTransactionModel.set('toJSON', { transform: removeExtraInfo });
exports.CollegeTransactionModel.set('toObject', { transform: removeExtraInfo });
exports.CollegeTransaction = mongoose_1.default.model(constants_1.COLLECTION_NAMES.TRANSACTION_HISTORY, exports.CollegeTransactionModel);
