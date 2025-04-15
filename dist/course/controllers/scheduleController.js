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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLecturePlan = exports.getScheduleInformation = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const mongoose_1 = __importDefault(require("mongoose"));
const course_1 = require("../models/course");
const formatResponse_1 = require("../../utils/formatResponse");
const scheduleSchema_1 = require("../validators/scheduleSchema");
const http_errors_1 = __importDefault(require("http-errors"));
exports.getScheduleInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { courseId, semesterId, subjectId, instructorId, search, page = 1, limit = 10 } = req.body;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    instructorId = new mongoose_1.default.Types.ObjectId(instructorId);
    const pipeline = [
        {
            $match: {
                _id: courseId,
            },
        },
        {
            $addFields: {
                semesterDetails: {
                    $first: {
                        $filter: {
                            input: "$semester",
                            as: "sem",
                            cond: {
                                $eq: ["$$sem._id", semesterId],
                            },
                        },
                    },
                },
            },
        },
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
            $unwind: "$semesterDetails.subjects",
        },
        {
            $match: {
                "semesterDetails.subjects._id": subjectId,
            },
        },
        {
            $addFields: {
                matchingLecturePlans: {
                    $filter: {
                        input: "$semesterDetails.subjects.schedule.lecturePlan",
                        as: "lp",
                        cond: {
                            $eq: ["$$lp.instructor", instructorId],
                        },
                    },
                },
                matchingPracticalPlans: {
                    $filter: {
                        input: "$semesterDetails.subjects.schedule.practicalPlan",
                        as: "pp",
                        cond: {
                            $eq: ["$$pp.instructor", instructorId],
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: "Users",
                localField: "semesterDetails.subjects.instructor",
                foreignField: "_id",
                as: "instructorDetails",
            },
        },
        { $unwind: "$instructorDetails" },
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
            $project: {
                subjectName: "$semesterDetails.subjects.subjectName",
                subjectCode: "$semesterDetails.subjects.subjectCode",
                instructorName: "$instructorDetails.name",
                courseId: "$_id",
                courseName: "$courseName",
                courseCode: "$courseCode",
                courseYear: "$courseYear",
                semesterId: "$semesterDetails._id",
                semesterNumber: "$semesterDetails.semesterNumber",
                subjectId: "$semesterDetails.subjects._id",
                instructorId: "$instructorDetails._id",
                departmentMetaDataId: "$departmentMetaData._id",
                departmentName: "$departmentMetaData.departmentName",
                departmentHOD: "$departmentMetaData.departmentHOD",
                collegeName: "$collegeName",
                schedule: {
                    lecturePlan: "$matchingLecturePlans",
                    practicalPlan: "$matchingPracticalPlans",
                    additionalResources: "$semesterDetails.subjects.schedule.additionalResources",
                },
            },
        },
    ];
    let subjectDetails = yield course_1.Course.aggregate(pipeline);
    let payload = subjectDetails[0];
    return (0, formatResponse_1.formatResponse)(res, 200, 'Plans fetched successfully', true, payload);
}));
exports.createLecturePlan = (0, express_async_handler_1.default)((req, res) => {
    const lecturePlanData = req.body;
    const validation = scheduleSchema_1.createLecturePlanSchema.safeParse(lecturePlanData);
    if (!validation.success)
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    let { courseId, semesterId, subjectId, instructorId } = lecturePlanData, lecturePlan = __rest(lecturePlanData, ["courseId", "semesterId", "subjectId", "instructorId"]);
    //Ahiya thi baaki che.
});
