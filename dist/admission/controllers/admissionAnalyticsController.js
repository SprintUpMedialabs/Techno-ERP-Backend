"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmissionStats = exports.incrementAdmissionAnalytics = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const admissionAnalytics_1 = require("../models/admissionAnalytics");
const constants_1 = require("../../config/constants");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const formatResponse_1 = require("../../utils/formatResponse");
// DACHECK: This function should be robust enough so that if it get failed then it retries by its own until it get success and also should send mails upon 5th attempt failure
// TEST: this function is going to be tested with the time
const incrementAdmissionAnalytics = (courseCode) => __awaiter(void 0, void 0, void 0, function* () {
    const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
    const updates = [
        {
            type: constants_1.AdmissionAggregationType.DATE_WISE,
            date: now.clone().startOf('day').toDate(), // exact IST date
            courseCode: 'ALL',
        },
        {
            type: constants_1.AdmissionAggregationType.MONTH_WISE,
            date: now.clone().startOf('month').toDate(), // 01/MM/YYYY
            courseCode: 'ALL',
        },
        {
            type: constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE,
            date: now.clone().startOf('month').toDate(), // 01/MM/YYYY
            courseCode: courseCode,
        },
        {
            type: constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE,
            date: now.clone().startOf('year').toDate(), // 01/01/YYYY
            courseCode: courseCode,
        },
    ];
    const updatePromises = updates.map(({ type, date, courseCode }) => admissionAnalytics_1.AdmissionAnalyticsModel.findOneAndUpdate({ type, date, courseCode }, { $inc: { count: 1 } }, { upsert: true, new: true }));
    yield Promise.all(updatePromises);
});
exports.incrementAdmissionAnalytics = incrementAdmissionAnalytics;
const getStartOfDateByType = (type, dateStr) => {
    const format = 'DD-MM-YYYY'; // Corrected format
    const baseMoment = moment_timezone_1.default.tz(dateStr, format, 'Asia/Kolkata');
    switch (type) {
        case constants_1.AdmissionAggregationType.MONTH_WISE:
        case constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE:
            return baseMoment.startOf('month');
        case constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE:
            return baseMoment.startOf('year');
        default:
            return baseMoment.startOf('day');
    }
};
// TEST: this function is going to be tested with the time
exports.getAdmissionStats = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, date } = req.query;
    if (!type || !date) {
        throw (0, http_errors_1.default)(400, 'type and date are required');
    }
    const baseDate = getStartOfDateByType(type, date);
    let queryFilters = [];
    if (type === constants_1.AdmissionAggregationType.DATE_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'days');
            if (d.month() === baseDate.month()) {
                queryFilters.push({ type, date: d.toDate() });
            }
        }
    }
    else if (type === constants_1.AdmissionAggregationType.MONTH_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'months');
            if (d.year() === baseDate.year()) {
                queryFilters.push({ type, date: d.startOf('month').toDate() });
            }
        }
    }
    else if (type === constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE || type === constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
        queryFilters.push({ type, date: baseDate.toDate(), courseCode: { $ne: 'ALL' } });
    }
    else {
        throw (0, http_errors_1.default)(400, 'Invalid type');
    }
    const data = yield admissionAnalytics_1.AdmissionAnalyticsModel.find({ $or: queryFilters });
    (0, formatResponse_1.formatResponse)(res, 200, 'Admission stats fetched successfully', true, data);
}));
