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
exports.AttemptLog = exports.AttemptStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
var AttemptStatus;
(function (AttemptStatus) {
    AttemptStatus["STARTED"] = "STARTED";
    AttemptStatus["COMPLETED"] = "COMPLETED";
    AttemptStatus["FAILED"] = "FAILED";
})(AttemptStatus || (exports.AttemptStatus = AttemptStatus = {}));
const attemptLogSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: [true, 'Type is required'],
    },
    status: {
        type: String,
        enum: {
            values: Object.values(AttemptStatus),
            message: 'Invalid status value',
        },
        required: [true, 'Status is required'],
    },
    attemptNo: {
        type: Number,
        required: [true, 'Attempt number is required'],
        min: [1, 'Attempt number must be at least 1'],
    },
    date: {
        type: Date,
        default: () => {
            // Set date to only date part (midnight) in Asia/Kolkata
            const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata').startOf('day');
            return now.toDate();
        },
    },
    time: {
        type: Date,
        default: () => {
            // Full datetime with current time in Asia/Kolkata
            return (0, moment_timezone_1.default)().tz('Asia/Kolkata').toDate();
        },
    },
}, { timestamps: true });
// Error handler
attemptLogSchema.post('save', function (error, doc, next) {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else {
        next(error);
    }
});
// Output formatting
const transformDateTime = (_, ret) => {
    if (ret.date) {
        ret.date = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret.date); // e.g., "18/05/2025"
    }
    if (ret.time) {
        ret.time = (0, moment_timezone_1.default)(ret.time).tz('Asia/Kolkata').format('HH:mm:ss'); // e.g., "14:45:30"
    }
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
};
attemptLogSchema.set('toJSON', { transform: transformDateTime });
attemptLogSchema.set('toObject', { transform: transformDateTime });
exports.AttemptLog = mongoose_1.default.model('AttemptLog', attemptLogSchema);
