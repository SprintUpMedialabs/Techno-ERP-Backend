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
exports.createSubject = exports.getSubjectInformation = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const course_1 = require("../models/course");
const formatResponse_1 = require("../../utils/formatResponse");
const subjectSchema_1 = require("../validators/subjectSchema");
const http_errors_1 = __importDefault(require("http-errors"));
exports.getSubjectInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { courseId, semesterId, search, page = 1, limit = 10 } = req.body;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    const skip = (page - 1) * limit;
    const pipeline = [
        { $match: { _id: courseId } },
        {
            $addFields: {
                semesterDetails: {
                    $filter: {
                        input: "$semester",
                        as: "sem",
                        cond: { $eq: ["$$sem._id", semesterId] },
                    },
                },
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
        { $unwind: "$semesterDetails" },
        {
            $addFields: {
                courseYear: {
                    $switch: {
                        branches: [
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [1, 2]] },
                                then: "First",
                            },
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [3, 4]] },
                                then: "Second",
                            },
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [5, 6]] },
                                then: "Third",
                            },
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [7, 8]] },
                                then: "Fourth",
                            },
                        ],
                        default: "Unknown",
                    },
                },
            },
        },
        {
            $match: { "semesterDetails._id": semesterId },
        },
        {
            $unwind: "$semesterDetails.subjects"
        },
        {
            $match: search ? {
                $or: [
                    { "semesterDetails.subjects.subjectName": { $regex: search, $options: "i" } },
                    { "semesterDetails.subjects.subjectCode": { $regex: search, $options: "i" } }
                ]
            } : {}
        },
        {
            $lookup: {
                from: "users",
                localField: "semester.subjects.instructor",
                foreignField: "_id",
                as: "instructorDetails",
            },
        },
        {
            $unwind: "$instructorDetails"
        },
        {
            $addFields: {
                subjectDetails: {
                    subjectId: "$semesterDetails.subjects._id",
                    subjectName: "$semesterDetails.subjects.subjectName",
                    subjectCode: "$semesterDetails.subjects.subjectCode",
                    instructorName: "$instructorDetails.firstName",
                    instructorId: "$instructorDetails._id",
                    numberOfLectures: {
                        $size: {
                            $filter: {
                                input: "$semesterDetails.subjects.schedule.lecturePlan",
                                as: "lecture",
                                cond: { $eq: ["$$lecture.instructor", "$instructorDetails._id"] }
                            }
                        }
                    }
                },
            }
        },
        {
            $group: {
                _id: {
                    courseId: "$_id",
                    courseName: "$courseName",
                    courseCode: "$courseCode",
                    semesterId: "$semesterDetails._id",
                    semesterNumber: "$semesterDetails.semesterNumber",
                    academicYear: "$semesterDetails.academicYear",
                    courseYear: "$courseYear",
                    collegeName: "$collegeName",
                    departmentName: "$departmentMetaData.departmentName",
                    departmentHOD: "$departmentMetaData.departmentHOD",
                },
                subjectDetails: { $push: "$subjectDetails" },
            },
        },
        {
            $project: {
                _id: 0,
                courseId: "$_id.courseId",
                courseName: "$_id.courseName",
                courseCode: "$_id.courseCode",
                semesterId: "$_id.semesterId",
                semesterNumber: "$_id.semesterNumber",
                academicYear: "$_id.academicYear",
                courseYear: "$_id.courseYear",
                collegeName: "$_id.collegeName",
                departmentName: "$_id.departmentName",
                departmentHOD: "$_id.departmentHOD",
                subjectDetails: 1
            }
        },
        { $skip: skip },
        { $limit: limit },
    ];
    let subjectDetails = yield course_1.Course.aggregate(pipeline);
    let payload = subjectDetails[0];
    const totalCount = yield course_1.Course.aggregate([
        { $match: { _id: courseId } },
        { $unwind: "$semester" },
        { $match: { "semester._id": semesterId } },
        { $unwind: "$semester.subjects" },
        {
            $project: {
                instructors: "$semester.subjects.instructor",
            },
        },
        { $unwind: "$instructors" },
        { $count: "totalCount" },
    ]);
    const totalItems = totalCount.length ? totalCount[0].totalCount : 0;
    const totalPages = Math.ceil(totalItems / limit);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Subject Details fetched for course and semester', true, {
        payload,
        pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            limit,
        },
    });
}));
exports.createSubject = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subjectData = req.body;
    const validation = subjectSchema_1.createSubjectSchema.safeParse(subjectData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { courseId, semesterId } = subjectData;
    const { subjectName, subjectCode, instructor } = subjectData;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    const instructorIds = instructor || [];
    const instructorObjectIDs = instructorIds.map(id => new mongoose_1.default.Types.ObjectId(id));
    const updateSemesterInformation = yield course_1.Course.updateOne({ _id: courseId, "semester._id": semesterId }, {
        $push: {
            "semester.$.subjects": {
                subjectName,
                subjectCode,
                instructor: instructorObjectIDs,
            }
        }
    });
    if (updateSemesterInformation.modifiedCount === 0) {
        throw (0, http_errors_1.default)(404, 'Error occurred saving the subject information');
    }
    return (0, formatResponse_1.formatResponse)(res, 201, 'Successfully added subject information', true, updateSemesterInformation);
}));
