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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingUserWiseAnalytics = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const BaseMarketingUserWiseAnalyticsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
        required: true
    },
    userFirstName: {
        type: String,
        required: true
    },
    userLastName: {
        type: String,
        required: true
    },
    totalCalls: {
        type: Number,
        required: true,
        default: 0
    },
    newLeadCalls: {
        type: Number,
        required: true,
        default: 0
    },
    activeLeadCalls: {
        type: Number,
        required: true,
        default: 0
    },
    nonActiveLeadCalls: {
        type: Number,
        required: true,
        default: 0
    },
    totalFootFall: {
        type: Number,
        required: true,
        default: 0
    },
    totalAdmissions: {
        type: Number,
        required: true,
        default: 0
    },
}, { _id: false });
const MarketingUserWiseAnalyticsSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true
    },
    data: {
        type: [BaseMarketingUserWiseAnalyticsSchema],
        default: []
    },
}, { timestamps: true });
exports.MarketingUserWiseAnalytics = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.MARKETING_USER_WISE_ANALYTICS, MarketingUserWiseAnalyticsSchema);
