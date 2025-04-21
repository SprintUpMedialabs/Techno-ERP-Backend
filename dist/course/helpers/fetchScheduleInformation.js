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
exports.fetchScheduleInformation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const course_1 = require("../models/course");
const fetchScheduleInformation = (crsId, semId, subId, insId) => __awaiter(void 0, void 0, void 0, function* () {
    let courseId = new mongoose_1.default.Types.ObjectId(crsId);
    let semesterId = new mongoose_1.default.Types.ObjectId(semId);
    let subjectId = new mongoose_1.default.Types.ObjectId(subId);
    let instructorId = new mongoose_1.default.Types.ObjectId(insId);
    console.log(courseId, semesterId, subjectId, instructorId);
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
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [9, 10]] },
                                then: "Fifth",
                            },
                            {
                                case: { $in: ["$semesterDetails.semesterNumber", [11, 12]] },
                                then: "Sixth",
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
                from: "users",
                let: { instructorId: instructorId },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$instructorId"]
                            }
                        }
                    }
                ],
                as: "instructorDetails"
            }
        },
        {
            $unwind: {
                path: "$instructorDetails",
                preserveNullAndEmptyArrays: true // safe if no match
            }
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
            $project: {
                _id: 0,
                courseId: "$_id",
                semesterId: "$semesterDetails._id",
                subjectId: "$semesterDetails.subjects._id",
                scheduleId: "$semesterDetails.subjects.schedule._id",
                instructorId: "$instructorDetails._id",
                departmentMetaDataId: "$departmentMetaData._id",
                courseName: "$courseName",
                courseCode: "$courseCode",
                courseYear: "$courseYear",
                semesterNumber: "$semesterDetails.semesterNumber",
                subjectName: "$semesterDetails.subjects.subjectName",
                subjectCode: "$semesterDetails.subjects.subjectCode",
                instructorName: "$instructorDetails.firstName",
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
    return payload;
});
exports.fetchScheduleInformation = fetchScheduleInformation;
