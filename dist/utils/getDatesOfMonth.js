"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatesOfMonth = getDatesOfMonth;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const http_errors_1 = __importDefault(require("http-errors"));
function getDatesOfMonth(monthNumber) {
    if (monthNumber < 1 || monthNumber > 12) {
        throw (0, http_errors_1.default)(400, "Invalid Month Number");
    }
    const istZone = "Asia/Kolkata";
    const baseDate = moment_timezone_1.default.tz(istZone);
    const year = baseDate.year();
    const startOfMonth = moment_timezone_1.default.tz({ year, month: monthNumber - 1, day: 1 }, istZone);
    const daysInMonth = startOfMonth.daysInMonth();
    const datesOfMonth = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = moment_timezone_1.default.tz({ year, month: monthNumber - 1, day }, istZone)
            .startOf("day")
            .toDate();
        datesOfMonth.push(date);
    }
    return datesOfMonth;
}
