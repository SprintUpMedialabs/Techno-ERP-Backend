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
exports.AdmissionAnalyticsModel = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const admissionAnalyticsSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.AdmissionAggregationType),
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    count: {
        type: Number,
        required: true,
        default: 0,
    },
    courseName: {
        type: String,
        required: true,
    },
}, { timestamps: true });
// Optional compound index if you're querying often by (type + date + courseName)
admissionAnalyticsSchema.index({ type: 1, date: 1, courseName: 1 }, { unique: true });
const transformDates = (_, ret) => {
    ['date'].forEach((key) => {
        ret[key] = (0, moment_timezone_1.default)(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY');
    });
    delete ret.createdAt;
    delete ret.__v;
    return ret;
};
admissionAnalyticsSchema.set('toJSON', { transform: transformDates });
admissionAnalyticsSchema.set('toObject', { transform: transformDates });
exports.AdmissionAnalyticsModel = mongoose_1.default.model(constants_1.COLLECTION_NAMES.ADMISSION_ANALYTICS, admissionAnalyticsSchema);
