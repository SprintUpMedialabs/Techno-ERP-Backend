"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviousDayDateTime = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const getPreviousDayDateTime = () => {
    const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
    return {
        startOfYesterday: now.clone().subtract(1, 'days').startOf('day').toDate(),
        endOfYesterday: now.clone().subtract(1, 'days').endOf('day').toDate(),
    };
};
exports.getPreviousDayDateTime = getPreviousDayDateTime;
