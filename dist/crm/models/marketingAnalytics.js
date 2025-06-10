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
exports.MarketingAnalyticsModel = exports.marketingAnalyticsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const baseMarketingAnalyticsModel = new mongoose_1.Schema({
    date: { type: Date, required: true },
    data: [{
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                required: true,
                ref: "User"
            },
            noOfCalls: {
                type: Number,
                required: true
            }
        }]
});
exports.marketingAnalyticsModel = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.MarketingAnalyticsEnum),
        required: true
    },
    lastUpdatedAt: {
        type: Date,
        required: true
    },
    details: {
        type: [baseMarketingAnalyticsModel],
        required: true
    }
});
exports.MarketingAnalyticsModel = mongoose_1.default.model(constants_1.COLLECTION_NAMES.MARKETING_ANALYTICS, exports.marketingAnalyticsModel);
