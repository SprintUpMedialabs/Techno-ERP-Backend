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
exports.getAdmissionStats = exports.assignBaseValueToAdmissionAnalytics = exports.incrementAdmissionAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const constants_1 = require("../../config/constants");
const courseMetadata_1 = require("../../course/models/courseMetadata");
const formatResponse_1 = require("../../utils/formatResponse");
const admissionAnalytics_1 = require("../models/admissionAnalytics");
const retryMechanism_1 = require("../../config/retryMechanism");
const controller_1 = require("../../pipline/controller");
const mongoose_1 = __importDefault(require("mongoose"));
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
exports.assignBaseValueToAdmissionAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.query;
    const courseList = yield courseMetadata_1.CourseMetaData.find().select('courseCode courseName');
    const courseCodeList = courseList.map(course => ({ courseCode: course.courseCode, courseName: course.courseName }));
    const now = (0, moment_timezone_1.default)().tz('Asia/Kolkata');
    if (!Object.values(constants_1.AdmissionAggregationType).includes(type)) {
        throw (0, http_errors_1.default)(400, 'Invalid type');
    }
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT);
    if (!pipelineId)
        throw (0, http_errors_1.default)(400, "Pipeline creation failed");
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        if (type === constants_1.AdmissionAggregationType.DATE_WISE) {
            yield admissionAnalytics_1.AdmissionAnalyticsModel.create([{
                    type,
                    date: now.clone().startOf('day').toDate(),
                    courseCode: 'ALL',
                    count: 0,
                }], { session });
        }
        else if (type === constants_1.AdmissionAggregationType.MONTH_WISE) {
            yield admissionAnalytics_1.AdmissionAnalyticsModel.create([{
                    type,
                    date: now.clone().startOf('month').toDate(),
                    courseCode: 'ALL',
                    count: 0,
                }], { session });
        }
        else if (type === constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
            yield Promise.all(courseCodeList.map((course) => __awaiter(void 0, void 0, void 0, function* () {
                return yield admissionAnalytics_1.AdmissionAnalyticsModel.create([{
                        type,
                        date: now.clone().startOf('month').toDate(),
                        courseCode: course.courseCode,
                        count: 0,
                    }], { session });
            })));
        }
        else if (type === constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
            yield Promise.all(courseCodeList.map((course) => __awaiter(void 0, void 0, void 0, function* () {
                return yield admissionAnalytics_1.AdmissionAnalyticsModel.create([{
                        type,
                        date: now.clone().startOf('year').toDate(),
                        courseCode: course.courseCode,
                        count: 0,
                    }], { session });
            })));
        }
    }), `Base value assignment failed`, `Base value assignment failed for type ${type}`, pipelineId, constants_1.PipelineName.ADMISSION_ANALYTICS_BASE_VALUE_ASSIGNMENT, 5, 500);
    (0, formatResponse_1.formatResponse)(res, 200, 'Base value assigned successfully', true, null);
}));
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
    else if (type === constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
        for (let i = 0; i < 5; i++) {
            const d = baseDate.clone().subtract(i, 'years');
            queryFilters.push({ type, date: d.startOf('year').toDate(), courseCode: { $ne: 'ALL' } });
        }
    }
    else if (type === constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
        queryFilters.push({ type, date: baseDate.toDate(), courseCode: { $ne: 'ALL' } });
    }
    else {
        throw (0, http_errors_1.default)(400, 'Invalid type');
    }
    const data = yield admissionAnalytics_1.AdmissionAnalyticsModel.find({ $or: queryFilters });
    if (type === constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE || type === constants_1.AdmissionAggregationType.YEAR_AND_COURSE_WISE) {
        // Group data by date
        const groupedData = {};
        data.forEach(item => {
            const dateStr = (0, moment_timezone_1.default)(item.date).tz('Asia/Kolkata').format('DD/MM/YYYY');
            if (!groupedData[dateStr]) {
                groupedData[dateStr] = { date: dateStr, courseWise: [] };
            }
            groupedData[dateStr].courseWise.push({
                count: item.count,
                courseCode: item.courseCode,
            });
        });
        const formattedData = Object.values(groupedData);
        if (type === constants_1.AdmissionAggregationType.MONTH_AND_COURSE_WISE) {
            (0, formatResponse_1.formatResponse)(res, 200, 'Admission stats fetched successfully', true, { monthWise: formattedData });
        }
        else {
            (0, formatResponse_1.formatResponse)(res, 200, 'Admission stats fetched successfully', true, { yearWise: formattedData });
        }
    }
    else {
        // For other types, keep existing format
        (0, formatResponse_1.formatResponse)(res, 200, 'Admission stats fetched successfully', true, data);
    }
}));
