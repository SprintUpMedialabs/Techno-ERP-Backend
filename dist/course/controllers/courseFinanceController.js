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
exports.getCourseDuesByDate = exports.courseFeeDues = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const retryMechanism_1 = require("../../config/retryMechanism");
const student_1 = require("../../student/models/student");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const courseDues_1 = require("../models/courseDues");
const courseMetadata_1 = require("../models/courseMetadata");
exports.courseFeeDues = (0, express_async_handler_1.default)((_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];
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
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        for (const course of courseList) {
            const { courseCode, courseName, courseDuration, collegeName } = course;
            const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));
            const department = course.departmentMetaDataId;
            const hod = department === null || department === void 0 ? void 0 : department.departmentHODId;
            const departmentHODName = hod ? `${hod.firstName} ${hod.lastName}` : '';
            const departmentHODEmail = hod === null || hod === void 0 ? void 0 : hod.email;
            const courseDetails = {
                collegeName,
                courseCode,
                courseName,
                academicYear,
                dues: [],
                date,
                departmentHODName,
                departmentHODEmail
            };
            for (let i = 1; i <= courseDuration; i++) {
                const courseYear = courseYears[i];
                const semNumbers = [i * 2 - 1, i * 2];
                const resultArray = yield student_1.Student.aggregate([
                    {
                        $match: {
                            courseCode,
                            currentAcademicYear: academicYear,
                            currentSemester: { $in: semNumbers },
                            feeStatus: { $ne: constants_1.FeeStatus.PAID }
                        }
                    },
                    {
                        $project: {
                            totalDueAmount: {
                                $sum: {
                                    $map: {
                                        input: {
                                            $filter: {
                                                input: '$semester',
                                                as: 'sem',
                                                cond: {
                                                    $and: [
                                                        { $ne: ['$$sem.fees.dueDate', null] },
                                                        { $ifNull: ['$$sem.fees.dueDate', false] }
                                                    ]
                                                }
                                            }
                                        },
                                        as: 'filteredSem',
                                        in: {
                                            $subtract: [
                                                '$$filteredSem.fees.totalFinalFee',
                                                '$$filteredSem.fees.paidAmount'
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalDue: { $sum: '$totalDueAmount' },
                            dueStudentCount: { $sum: 1 }
                        }
                    }
                ]).session(session);
                const { totalDue = 0, dueStudentCount = 0 } = (_a = resultArray[0]) !== null && _a !== void 0 ? _a : {};
                courseDetails.dues.push({ courseYear, totalDue, dueStudentCount });
            }
            yield courseDues_1.CourseDues.create([courseDetails], { session });
        }
    }), 'Course Dues Pipeline Failure', "All retry limits expired for the course dues creation");
    return (0, formatResponse_1.formatResponse)(res, 200, 'course dues recorded successfully', true);
}));
exports.getCourseDuesByDate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, collegeName } = req.body;
    if (!date || typeof date !== "string") {
        throw (0, http_errors_1.default)(400, "Date is required in dd/mm/yyyy format");
    }
    const collegeFilter = (collegeName === "ALL")
        ? { collegeName: { $in: [constants_1.FormNoPrefixes.TCL, constants_1.FormNoPrefixes.TIHS, constants_1.FormNoPrefixes.TIMS] } }
        : { collegeName };
    const targetDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(date);
    console.log(targetDate);
    const dues = yield courseDues_1.CourseDues.find(Object.assign({ date: targetDate }, collegeFilter));
    return (0, formatResponse_1.formatResponse)(res, 200, "Course dues fetched", true, dues);
}));
