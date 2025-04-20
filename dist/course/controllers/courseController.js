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
exports.fetchAllUniqueCourses = exports.getCourseInformation = exports.searchCourses = exports.updateCourse = exports.createCourse = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const courseSchema_1 = require("../validators/courseSchema");
const http_errors_1 = __importDefault(require("http-errors"));
const getAcaYrFromStartYrSemNum_1 = require("../utils/getAcaYrFromStartYrSemNum");
const course_1 = require("../models/course");
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const courseData = req.body;
    const validation = courseSchema_1.courseSchema.safeParse(courseData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const semester = Array.from({ length: courseData.totalSemesters }, (_, index) => ({
        semesterNumber: index + 1,
        academicYear: (0, getAcaYrFromStartYrSemNum_1.getAcaYrFromStartYrSemNum)(courseData.startingYear, index),
        subjects: [],
    }));
    yield course_1.Course.create(Object.assign(Object.assign({}, courseData), { semester: semester }));
    // const courseInformation = await getCourseInformation("", getCurrentAcademicYear());
    return (0, formatResponse_1.formatResponse)(res, 201, 'Course created successfully', true, null);
}));
exports.updateCourse = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateCourseData = req.body;
    const validation = courseSchema_1.courseUpdateSchema.safeParse(updateCourseData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    let { courseId, courseName, courseCode, collegeName, departmentMetaDataId } = validation.data;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    departmentMetaDataId = new mongoose_1.default.Types.ObjectId(departmentMetaDataId);
    const updateResult = yield course_1.Course.updateOne({ _id: courseId }, {
        $set: {
            courseName,
            courseCode,
            collegeName,
            departmentMetaDataId: departmentMetaDataId,
        },
    });
    if (updateResult.modifiedCount === 0) {
        throw (0, http_errors_1.default)(404, 'Course not found or no changes made');
    }
    // const responsePayload = getCourseInformation("", getCurrentAcademicYear());
    return (0, formatResponse_1.formatResponse)(res, 200, 'Course updated successfully', true, null);
}));
exports.searchCourses = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { search, academicYear, page, limit } = req.body;
    let courseInformation = yield (0, exports.getCourseInformation)(search, academicYear, page, limit);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Courses fetched successfully', true, courseInformation);
}));
const getCourseInformation = (search_1, academicYear_1, ...args_1) => __awaiter(void 0, [search_1, academicYear_1, ...args_1], void 0, function* (search, academicYear, page = 1, limit = 10) {
    var _a, _b, _c;
    const skip = (page - 1) * limit;
    const pipeline = [
        {
            $match: {
                $or: [
                    { courseName: { $regex: search || "", $options: "i" } },
                    { courseCode: { $regex: search || "", $options: "i" } },
                ],
            },
        },
        {
            $unwind: "$semester",
        },
        {
            $match: {
                "semester.academicYear": academicYear,
            },
        },
        {
            $lookup: {
                from: "departmentmetadatas",
                localField: "departmentMetaDataId",
                foreignField: "_id",
                as: "departmentMetaData",
            },
        },
        { $unwind: "$departmentMetaData" },
        {
            $facet: {
                paginatedResults: [
                    {
                        $project: {
                            _id: 0,
                            courseId: "$_id",
                            courseName: 1,
                            courseCode: 1,
                            semesterId: "$semester._id",
                            semesterNumber: "$semester.semesterNumber",
                            courseYear: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 1] }, then: "First" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 2] }, then: "Second" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 3] }, then: "Third" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 4] }, then: "Fourth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 5] }, then: "Fifth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$semester.semesterNumber", 2] } }, 6] }, then: "Sixth" },
                                    ],
                                    default: "Unknown"
                                }
                            },
                            academicYear: "$semester.academicYear",
                            departmentName: "$departmentMetaData.departmentName",
                            departmentHOD: "$departmentMetaData.departmentHOD",
                            numberOfSubjects: { $size: "$semester.subjects" },
                        }
                    },
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];
    const result = yield course_1.Course.aggregate(pipeline);
    const courseInformation = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.paginatedResults) || [];
    const totalItems = ((_c = (_b = result[0]) === null || _b === void 0 ? void 0 : _b.totalCount[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
    const totalPages = Math.ceil(totalItems / limit);
    return {
        courseInformation,
        pagination: {
            currentPage: page,
            totalItems,
            totalPages,
        }
    };
});
exports.getCourseInformation = getCourseInformation;
exports.fetchAllUniqueCourses = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
        {
            $group: {
                _id: { courseCode: "$courseCode", courseName: "$courseName" }
            }
        },
        {
            $project: {
                _id: 0,
                courseCode: "$_id.courseCode",
                courseName: "$_id.courseName"
            }
        }
    ];
    const courses = yield course_1.Course.aggregate(pipeline);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Unique Courses fetched successfully', true, courses);
}));
