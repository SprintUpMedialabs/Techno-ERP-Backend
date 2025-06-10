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
exports.MarketingSourceWiseAnalytics = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const moment_1 = __importDefault(require("moment"));
const DataSchema = new mongoose_1.Schema({
    totalLeads: { type: Number, required: true },
    activeLeads: { type: Number, required: true },
    neutralLeads: { type: Number, required: true },
    didNotPickLeads: { type: Number, required: true },
    others: { type: Number, required: true },
    footFall: { type: Number, required: true },
    totalAdmissions: { type: Number, required: true },
}, { _id: false });
const BaseMarketingSourceSchema = new mongoose_1.Schema({
    source: { type: String, required: true },
    data: { type: DataSchema, required: true },
}, { _id: false });
const MarketingSourceWiseAnalyticsSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['all-leads', 'offline-data', 'online-data'],
        required: true,
    },
    details: {
        type: [BaseMarketingSourceSchema],
        required: true,
    },
}, { timestamps: true });
const transformDates = (_, ret) => {
    ['leadTypeModifiedDate', 'nextDueDate', 'date', 'updatedAt'].forEach((key) => {
        if (key == 'updatedAt') {
            if (ret[key]) {
                ret[key] = (0, moment_1.default)(ret[key]).tz('Asia/Kolkata').format('DD/MM/YYYY | HH:mm');
            }
        }
        else if (ret[key]) {
            ret[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret[key]);
        }
    });
    delete ret.updatedAt;
    delete ret.createdAt;
    delete ret.__v;
    delete ret._id;
    return ret;
};
MarketingSourceWiseAnalyticsSchema.set('toJSON', { transform: transformDates });
MarketingSourceWiseAnalyticsSchema.set('toObject', { transform: transformDates });
exports.MarketingSourceWiseAnalytics = mongoose_1.default.model('MarketingSourceWiseAnalytics', MarketingSourceWiseAnalyticsSchema);
