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
exports.DepartmentMetaData = exports.departmentModelSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const http_errors_1 = __importDefault(require("http-errors"));
;
exports.departmentModelSchema = new mongoose_1.Schema({
    departmentName: {
        type: String,
        required: [true, 'Department Name is required'],
    },
    departmentHOD: {
        type: String,
        required: [true, 'Department HOD Name is required'],
    },
    startingYear: {
        type: Number,
        required: [true, 'Starting year is required'],
        validate: {
            validator: (val) => /^\d{4}$/.test(val.toString()),
            message: 'Year must be a valid 4 digit number!',
        },
    },
    // There is no need to validate here as it will be taken care of by ZOD Schema.
    endingYear: {
        type: Number,
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
        next(error);
    }
};
exports.departmentModelSchema.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
exports.departmentModelSchema.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const transformDates = (_, ret) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.departmentModelSchema.set('toJSON', { transform: transformDates });
exports.departmentModelSchema.set('toObject', { transform: transformDates });
exports.DepartmentMetaData = mongoose_1.default.model(constants_1.COLLECTION_NAMES.DEPARTMENT_META_DATA, exports.departmentModelSchema);
