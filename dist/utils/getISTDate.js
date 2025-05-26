"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISTDate = getISTDate;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function getISTDate(offsetDays = 0) {
    const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
    const ist = now.clone().add(offsetDays, 'days').startOf('day').toDate();
    return ist;
}
