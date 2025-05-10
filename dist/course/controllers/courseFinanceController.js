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
const courseMetadata_1 = require("../models/courseMetadata");
const student_1 = require("../../student/models/student");
const courseDues_1 = require("../models/courseDues");
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../config/logger"));
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.courseFeeDues = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const courseYears = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];
    const academicYear = currentMonth >= 6
        ? `${currentYear}-${currentYear + 1}`
        : `${currentYear - 1}-${currentYear}`;
    // DTODO: populate hod info here only
    const courseList = yield courseMetadata_1.CourseMetaData.find({}, { courseCode: 1, courseName: 1, courseDuration: 1 });
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        for (const course of courseList) {
            const { courseCode, courseName, courseDuration } = course;
            const today = new Date();
            console.log(today.getFullYear(), today.getMonth(), today.getDate());
            const date = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            console.log(date);
            const courseDetails = { courseCode, courseName, academicYear, dues: [], date };
            for (let i = 1; i <= courseDuration; i++) {
                const courseYear = courseYears[i];
                const semNumbers = [i * 2 - 1, i * 2];
                const resultArray = yield student_1.Student.aggregate([
                    {
                        $match: {
                            courseCode,
                            currentAcademicYear: academicYear,
                            currentSemester: { $in: semNumbers }
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
                                                        // DTODO: fee ststus check
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
                ]);
                const { totalDue = 0, dueStudentCount = 0 } = (_a = resultArray[0]) !== null && _a !== void 0 ? _a : {};
                courseDetails.dues.push({ courseYear, totalDue, dueStudentCount });
            }
            yield courseDues_1.CourseDues.create([courseDetails], { session });
        }
        yield session.commitTransaction();
        session.endSession();
    }
    catch (error) {
        logger_1.default.error(error);
        yield (session === null || session === void 0 ? void 0 : session.abortTransaction());
        session === null || session === void 0 ? void 0 : session.endSession();
        throw (0, http_errors_1.default)(500, error);
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'course dues recorded successfully', true);
}));
exports.getCourseDuesByDate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = req.query;
    if (!date || typeof date !== "string") {
        throw (0, http_errors_1.default)(400, "Date is required in dd/mm/yyyy format");
    }
    const targetDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(date);
    console.log(targetDate);
    const dues = yield courseDues_1.CourseDues.find({ date: targetDate });
    return (0, formatResponse_1.formatResponse)(res, 200, "Course dues fetched", true, dues);
}));
