"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastSevenDates = getPastSevenDates;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const convertDateToFormatedDate_1 = require("./convertDateToFormatedDate");
function getPastSevenDates(dateStr) {
    const baseDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(dateStr);
    const istZone = 'Asia/Kolkata';
    const pastDates = [];
    // Start from 7 days ago up to today
    for (let i = 7; i >= 0; i--) {
        const pastDate = moment_timezone_1.default.tz(baseDate, istZone)
            .subtract(i, 'days')
            .startOf('day')
            .toDate();
        pastDates.push(pastDate);
    }
    return pastDates;
}
