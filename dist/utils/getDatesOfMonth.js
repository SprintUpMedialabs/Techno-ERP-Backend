"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatesOfMonth = getDatesOfMonth;
const http_errors_1 = __importDefault(require("http-errors"));
function getDatesOfMonth(monthNumber) {
    if (monthNumber < 1 || monthNumber > 12) {
        throw (0, http_errors_1.default)(400, "Invalid Month Number");
    }
    const baseDate = new Date();
    const year = baseDate.getUTCFullYear();
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const datesOfMonth = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, monthNumber - 1, day));
        datesOfMonth.push(date);
    }
    return datesOfMonth;
}
