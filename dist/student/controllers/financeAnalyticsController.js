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
const controller_1 = require("../../pipline/controller");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.createFinanceAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', constants_1.CourseYears.First, constants_1.CourseYears.Second, constants_1.CourseYears.Third, constants_1.CourseYears.Fourth];
    const date = (0, moment_timezone_1.default)().tz('Asia/Kolkata').startOf('day').subtract(1, 'day').toDate();
    const academicYear = currentMonth >= 6
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;
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
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.FINANCE_ANALYTICS);
    if (!pipelineId)
        throw (0, http_errors_1.default)(400, "Pipeline creation failed");
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
                // $project: {
                //   semesters: {
                //     $filter: {
                //       input: "$semester",
                //       as: "sem",
                //       // TODO: here we need to change the condition that 
                //         // 1. for current semster only it will be totalFinalFee
                //         // 2. for rest will have that benchmark [ this benchmark will get updated upon semseter change means the date on which semster get updated on the same date night we need to update this benchmark ]
                //       cond: { $in: ["$$sem.semesterNumber", semNumbers] }
                //     }
                //   }
                // }
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
                            totalFinalFee: {
                                $sum: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$semester',
                                                as: 'sem',
                                                cond: {
                                                    $and: [
                                                        { $ne: ['$$sem.fees.dueDate', null] },
                                                        { $ifNull: ['$$sem.fees.dueDate', false] },
                                                        { $eq: ['$$sem.semesterNumber', '$$ROOT.currentSemester'] }
                                                    ]
                                                }
                                            }
                                        },
                                        as: 'filteredSem',
                                        in: '$$filteredSem.fees.totalFinalFee'
                                    }
                                }
                            },
                            prevTotalDueAtSemStart: 1
                        }
                    },
                    {
                        $project: {
                            totalDueWithPrev: {
                                $add: ['$totalFinalFee', '$prevTotalDueAtSemStart']
                            }
                        }
                    },
                    {
                        $match: { totalDueWithPrev: { $gt: 0 } }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDueSum: { $sum: '$totalDueWithPrev' }
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
    }), 'Finance Analytics Pipeline Failure', "All retry limits expired for the finance analytics creation", pipelineId, constants_1.PipelineName.FINANCE_ANALYTICS);
    financeAnalyticsDetails.totalCollection = totalCollectionGlobal;
    financeAnalyticsDetails.totalExpectedRevenue = totalExpectedRevenueGlobal;
    yield financeAnalytics_1.FinanceAnalytics.create(financeAnalyticsDetails);
    return (0, formatResponse_1.formatResponse)(res, 201, "Finance Analytics created successfully!", true, null);
}));
// TODO: NEW ADDMISSION NEEDS TO BE HANDLE ALSO PASSOUT STUDENT DUES
exports.fetchDayWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.body;
    if (!date)
        throw (0, http_errors_1.default)("Please enter the date to fetch analytics!");
    const analyticsForDate = yield financeAnalytics_1.FinanceAnalytics.findOne({
        date: (0, convertDateToFormatedDate_1.convertToMongoDate)(date),
    });
    const pastDates = (0, getPastSevenDates_1.getPastSevenDates)(date);
    const pastSevenDocs = yield financeAnalytics_1.FinanceAnalytics.find({
        date: { $in: pastDates },
    }).sort({ date: 1 });
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
        const totalCollection = courseWise.details.reduce((acc, curr) => acc + curr.totalCollection, 0);
        courseWiseInformation.push({
            courseCode: courseWise.courseCode,
            totalCollection: totalCollection
        });
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Fetch day wise trend information successfully", true, {
        totalCollectionForThisDay: (analyticsForDate === null || analyticsForDate === void 0 ? void 0 : analyticsForDate.totalCollection) || 0,
        pastSevenDays: pastSevenDayDocs,
        courseWiseCollectionForThisDay: courseWiseInformation
    });
}));
exports.fetchMonthWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { monthNumber } = req.body;
    const datesOfMonth = (0, getDatesOfMonth_1.getDatesOfMonth)(monthNumber);
    // TODO: missing logic is i will not get data of previous months means left chart is not going to be created from this.
    let data = yield financeAnalytics_1.FinanceAnalytics.find({
        date: { $in: datesOfMonth },
    }).sort({ date: 1 });
    let totalCollectionForThisMonth = 0;
    // const monthWiseData: { date: string; totalCollection: number; }[] = [];
    const courseWiseObj = {};
    data.forEach((record) => {
        totalCollectionForThisMonth += record.totalCollection;
        // monthWiseData.push({
        //   date: convertToDDMMYYYY(record.date),
        //   totalCollection: record.totalCollection
        // });
        record.courseWise.forEach((course) => {
            const courseCode = course.courseCode;
            if (!courseWiseObj[courseCode]) {
                courseWiseObj[courseCode] = 0;
            }
            course.details.forEach((detail) => {
                courseWiseObj[courseCode] = (courseWiseObj[courseCode] || 0) + detail.totalCollection;
            });
        });
    });
    const courseWiseCollectionForThisMonth = Object.entries(courseWiseObj).map(([courseCode, totalCollection]) => ({
        courseCode,
        totalCollection
    }));
    // MONTH WISE DATA CALCULATION
    const timezone = 'Asia/Kolkata';
    const now = moment_timezone_1.default.tz(timezone);
    const currentYear = now.year();
    // Build array of {start, end, label} for last 7 months including given monthNumber
    // If month goes below 1, go to previous year
    const months = [];
    let year = currentYear;
    let month = monthNumber; // 1-12
    for (let i = 0; i < 7; i++) {
        if (month < 1) {
            month = 12;
            year--;
        }
        // start and end of month in timezone
        const startDate = moment_timezone_1.default.tz({ year, month: month - 1, day: 1 }, timezone).startOf('day').toDate();
        const endDate = moment_timezone_1.default.tz(startDate, timezone).endOf('month').endOf('day').toDate();
        months.push({
            year,
            month,
            startDate,
            endDate,
            label: moment_timezone_1.default.tz(startDate, timezone).format('MMMM YY') // e.g. May 25
        });
        month--;
    }
    // Get the overall date range for aggregation query
    const earliestStart = months[months.length - 1].startDate;
    const latestEnd = months[0].endDate;
    // Mongo aggregation pipeline
    const aggregation = [
        {
            $match: {
                date: { $gte: earliestStart, $lte: latestEnd }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' }
                },
                totalCollection: { $sum: '$totalCollection' }
            }
        }
    ];
    const results = yield financeAnalytics_1.FinanceAnalytics.aggregate(aggregation);
    // Create a map for quick lookup
    const resultMap = new Map();
    results.forEach(r => {
        const key = `${r._id.year}-${r._id.month}`;
        resultMap.set(key, r.totalCollection);
    });
    // Build final response array
    const monthWiseData = months.map(m => ({
        date: m.label,
        totalCollection: resultMap.get(`${m.year}-${m.month}`) || 0
    })).reverse(); // reverse so older month comes first
    return (0, formatResponse_1.formatResponse)(res, 200, "Monthwise analytics fetched successfully", true, {
        totalCollectionForThisMonth: totalCollectionForThisMonth,
        monthWiseData: monthWiseData,
        courseWiseCollectionForThisMonth: courseWiseCollectionForThisMonth
    });
}));
