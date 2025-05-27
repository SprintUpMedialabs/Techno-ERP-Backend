"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToDDMMYYYY = exports.convertToMongoDate = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const convertToMongoDate = (dateString) => {
    const istZone = 'Asia/Kolkata';
    if (dateString instanceof Date) {
        // Interpret this date in IST and set time to start of day
        return moment_timezone_1.default.tz(dateString, istZone).startOf('day').toDate();
    }
    // Parse the string assuming it's in 'DD/MM/YYYY' format in IST
    const date = moment_timezone_1.default.tz(dateString, 'DD/MM/YYYY', istZone);
    return date.startOf('day').toDate();
};
exports.convertToMongoDate = convertToMongoDate;
const convertToDDMMYYYY = (dateObj) => {
    if (!dateObj)
        return "";
    return moment_timezone_1.default.tz(dateObj, 'Asia/Kolkata').format('DD/MM/YYYY');
};
exports.convertToDDMMYYYY = convertToDDMMYYYY;
