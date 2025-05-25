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
exports.PipelineRunLog = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../config/constants");
const pipelineRunLogSchema = new mongoose_1.Schema({
    pipelineName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(constants_1.PipelineStatus),
        required: true,
    },
    attemptNo: {
        type: Number,
        required: true,
        min: 1,
    },
    date: {
        type: Date,
        default: () => (0, moment_timezone_1.default)().tz('Asia/Kolkata').startOf('day').toDate(),
    },
    time: {
        type: Date,
        default: () => (0, moment_timezone_1.default)().tz('Asia/Kolkata').toDate(),
    },
    durationInSeconds: {
        type: Number,
    },
    errorMessages: {
        type: [String],
        default: [],
    },
    startedAt: {
        type: Date,
        default: () => (0, moment_timezone_1.default)().tz('Asia/Kolkata').toDate(),
    },
}, { timestamps: true });
// Format date and time when converting to JSON
pipelineRunLogSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.__v;
        return ret;
    }
});
exports.PipelineRunLog = mongoose_1.default.model('PipelineRunLog', pipelineRunLogSchema);
