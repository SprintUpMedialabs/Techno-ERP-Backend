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
exports.fetchMonthWiseAnalytics = exports.fetchDayWiseAnalytics = exports.createFinanceAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const retryMechanism_1 = require("../../config/retryMechanism");
const courseMetadata_1 = require("../../course/models/courseMetadata");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const getDatesOfMonth_1 = require("../../utils/getDatesOfMonth");
const getPastSevenDates_1 = require("../../utils/getPastSevenDates");
const previousDayDateTime_1 = require("../../utils/previousDayDateTime");
const collegeTransactionHistory_1 = require("../models/collegeTransactionHistory");
const financeAnalytics_1 = require("../models/financeAnalytics");
const student_1 = require("../models/student");
/*
  academicYear : 2024-2025
  course
*/
exports.createFinanceAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', constants_1.CourseYears.First, constants_1.CourseYears.Second, constants_1.CourseYears.Third, constants_1.CourseYears.Fourth];
    //DTODO : Handle edge case here
    const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    const academicYear = currentMonth >= 6
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;
    console.log("Academic Year : ", academicYear);
    const courseList = yield courseMetadata_1.CourseMetaData.find({}, { courseCode: 1, courseName: 1, courseDuration: 1, departmentMetaDataId: 1, collegeName: 1 }).populate({
        path: 'departmentMetaDataId',
        select: 'departmentName departmentHODId',
        populate: {
            path: 'departmentHODId',
            select: 'firstName lastName email'
        }
    });
    const financeAnalyticsDetails = {
        date,
        academicYear,
        totalExpectedRevenue: 0,
        totalCollection: 0,
        courseWise: []
    };
    let totalExpectedRevenueGlobal = 0;
    let totalCollectionGlobal = 0;
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        for (const course of courseList) {
            const { courseCode, courseDuration } = course;
            const departmentName = course.departmentName;
            let totalExpectedRevenueCourseWise = 0;
            let totalCollectionCourseWise = 0;
            const courseWise = {
                courseCode,
                departmentName,
                totalCollection: 0,
                totalExpectedRevenue: 0,
                details: []
            };
            for (let i = 1; i <= courseDuration; i++) {
                const courseYear = courseYears[i];
                const semNumbers = [i * 2 - 1, i * 2];
                const courseYearDetail = {
                    courseYear,
                    totalCollection: 0,
                    totalExpectedRevenue: 0,
                    totalStudents: 0
                };
                const revenueResult = yield student_1.Student.aggregate([
                    {
                        $match: {
                            courseCode,
                            currentAcademicYear: academicYear,
                            currentSemester: { $in: semNumbers },
                        }
                    },
                    {
                        $project: {
                            semesters: {
                                $filter: {
                                    input: "$semester",
                                    as: "sem",
                                    cond: { $in: ["$$sem.semesterNumber", semNumbers] }
                                }
                            }
                        }
                    },
                    /*
                      3rd:
                      actual fee: 5000
                      paid : 5000
                      4th
                      actual fee: 5000
                      paid : 4000
                      5th
                      actual fee: 5000
                      paid : 4000
                      6th:
                      dueDate Null:
                    */
                    { $unwind: "$semesters" },
                    {
                        $group: {
                            _id: null,
                            totalFinalFeeSum: { $sum: "$semesters.fees.totalFinalFee" }
                        }
                    }
                ]).session(session);
                const totalExpectedRevenueCourseYearWise = ((_a = revenueResult[0]) === null || _a === void 0 ? void 0 : _a.totalFinalFeeSum) || 0;
                const yesterday = (0, previousDayDateTime_1.getPreviousDayDateTime)();
                const collectionResult = yield collegeTransactionHistory_1.CollegeTransaction.aggregate([
                    {
                        $match: {
                            courseCode,
                            courseYear,
                            dateTime: {
                                $gte: yesterday.startOfYesterday,
                                $lte: yesterday.endOfYesterday
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalCollection: { $sum: "$amount" }
                        }
                    }
                ]).session(session);
                const totalCollectionCourseYearWise = (_c = (_b = collectionResult[0]) === null || _b === void 0 ? void 0 : _b.totalCollection) !== null && _c !== void 0 ? _c : 0;
                courseYearDetail.totalCollection = totalCollectionCourseYearWise;
                courseYearDetail.totalExpectedRevenue = totalExpectedRevenueCourseYearWise;
                courseYearDetail.totalStudents = yield student_1.Student.countDocuments({
                    courseCode,
                    currentAcademicYear: academicYear,
                    currentSemester: { $in: semNumbers }
                }).session(session);
                totalCollectionCourseWise += totalCollectionCourseYearWise;
                totalExpectedRevenueCourseWise += totalExpectedRevenueCourseYearWise;
                courseWise.details.push(courseYearDetail);
            }
            courseWise.totalCollection = totalCollectionCourseWise;
            courseWise.totalExpectedRevenue = totalExpectedRevenueCourseWise;
            financeAnalyticsDetails.courseWise.push(courseWise);
            totalCollectionGlobal += totalCollectionCourseWise;
            totalExpectedRevenueGlobal += totalExpectedRevenueCourseWise;
        }
    }), 'Finance Analytics Pipeline Failure', "All retry limits expired for the finance analytics creation");
    financeAnalyticsDetails.totalCollection = totalCollectionGlobal;
    financeAnalyticsDetails.totalExpectedRevenue = totalExpectedRevenueGlobal;
    console.log(JSON.stringify(financeAnalyticsDetails, null, 2));
    yield financeAnalytics_1.FinanceAnalytics.create(financeAnalyticsDetails);
    return (0, formatResponse_1.formatResponse)(res, 201, "Finance Analytics created successfully!", true, null);
}));
exports.fetchDayWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.body;
    if (!date)
        throw (0, http_errors_1.default)("Please enter the date to fetch analytics!");
    const analyticsForDate = yield financeAnalytics_1.FinanceAnalytics.findOne({
        date: (0, convertDateToFormatedDate_1.convertToMongoDate)(date),
    });
    const pastDates = (0, getPastSevenDates_1.getPastSevenDates)(date);
    // console.log("Past 7 days dates are : ", pastDates);
    const pastSevenDocs = yield financeAnalytics_1.FinanceAnalytics.find({
        date: { $in: pastDates },
    }).sort({ date: 1 });
    // console.log("Past 7 days docs : ", pastSevenDocs);
    const pastSevenDayDocs = [];
    pastSevenDocs.forEach(daywiseDoc => {
        pastSevenDayDocs.push({
            date: (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(daywiseDoc.date),
            dailyCollection: daywiseDoc.totalCollection
        });
    });
    const courseWiseData = (analyticsForDate === null || analyticsForDate === void 0 ? void 0 : analyticsForDate.courseWise) || [];
    const courseWiseInformation = [];
    courseWiseData.forEach((courseWise) => {
        const detailsArray = courseWise.details.map((det) => ({
            courseYear: det.courseYear,
            totalCollection: det.totalCollection
        }));
        courseWiseInformation.push({
            courseCode: courseWise.courseCode,
            details: detailsArray
        });
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Fetch day wise trend information successfully", true, {
        totalCollection: (analyticsForDate === null || analyticsForDate === void 0 ? void 0 : analyticsForDate.totalCollection) || 0,
        pastSevenDays: pastSevenDayDocs,
        courseWiseInformation: courseWiseInformation
    });
}));
exports.fetchMonthWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { monthNumber } = req.body;
    const datesOfMonth = (0, getDatesOfMonth_1.getDatesOfMonth)(monthNumber);
    // console.log("Dates of Month are : ", datesOfMonth);
    let data = yield financeAnalytics_1.FinanceAnalytics.find({
        date: { $in: datesOfMonth },
    }).sort({ date: 1 });
    let totalCollection = 0;
    const monthWiseData = [];
    const courseWiseObj = {};
    data.forEach((record) => {
        totalCollection += record.totalCollection;
        monthWiseData.push({
            date: (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(record.date),
            totalCollection: record.totalCollection
        });
        record.courseWise.forEach((course) => {
            const courseCode = course.courseCode;
            if (!courseWiseObj[courseCode]) {
                courseWiseObj[courseCode] = {};
            }
            course.details.forEach((detail) => {
                const year = detail.courseYear;
                courseWiseObj[courseCode][year] = (courseWiseObj[courseCode][year] || 0) + detail.totalCollection;
            });
        });
    });
    const courseWiseCollection = Object.entries(courseWiseObj).map(([courseCode, yearObj]) => ({
        courseCode,
        details: Object.entries(yearObj).map(([courseYear, totalCollection]) => ({
            courseYear,
            totalCollection
        }))
    }));
    // console.log("Total Collection : ", totalCollection);
    // console.log("Month wise data : ", monthWiseData);
    // console.log("Course wise collection : ", courseWiseCollection);
    return (0, formatResponse_1.formatResponse)(res, 200, "Monthwise analytics fetched successfully", true, {
        totalCollection: totalCollection,
        monthWiseData: monthWiseData,
        courseWiseCollection: courseWiseCollection
    });
}));
