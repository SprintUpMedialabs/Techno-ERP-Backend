"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastSevenDates = getPastSevenDates;
const convertDateToFormatedDate_1 = require("./convertDateToFormatedDate");
function getPastSevenDates(dateStr) {
    const baseDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(dateStr);
    if (isNaN(baseDate.getTime()))
        throw new Error("Invalid date");
    const pastDates = [];
    for (let i = 7; i >= 0; i--) {
        const pastDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() - i));
        pastDates.push(pastDate);
    }
    return pastDates;
}
