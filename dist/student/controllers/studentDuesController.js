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
exports.fetchFeeInformationByStudentId = exports.getStudentDues = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const student_1 = require("../models/student");
const formatResponse_1 = require("../../utils/formatResponse");
//DACHECK : Here, it won't make sense to have filter on academic year, we can discuss this in meeting.
exports.getStudentDues = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page, limit, search, academicYear } = req.body;
    const filterStage = {
        feeStatus: constants_1.FeeStatus.DUE,
        currentAcademicYear: academicYear
    };
    if (search === null || search === void 0 ? void 0 : search.trim()) {
        filterStage.$and = [
            ...((_a = filterStage.$and) !== null && _a !== void 0 ? _a : []),
            {
                $or: [
                    { 'studentInfo.studentName': { $regex: search, $options: 'i' } },
                    { 'studentInfo.studentId': { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    // query.$and = [
    //     ...(query.$and || []),
    //     {
    //       $or: [
    //         { name: { $regex: search, $options: 'i' } },
    //         { phoneNumber: { $regex: search, $options: 'i' } }
    //       ]
    //     }
    //   ];
    // const commonPipeline = [
    //     { $match: filterStage },
    //     {
    //         $addFields: {
    //             currentSemesterData: {
    //                 $arrayElemAt: [
    //                     {
    //                         $filter: {
    //                             input: "$semester",
    //                             as: "sem",
    //                             cond: { $eq: ["$$sem.semesterNumber", "$currentSemester"] }
    //                         }
    //                     },
    //                     0
    //                 ]
    //             }
    //         }
    //     },
    //     {
    //         $match: {
    //             $expr: {
    //                 $ne: [
    //                     "$currentSemesterData.fees.paidAmount",
    //                     "$currentSemesterData.fees.totalFinalFee"
    //                 ]
    //             },
    //             ...searchMatchStage
    //         }
    //     }
    // ];
    // const totalCountAgg = await Student.aggregate([
    //     ...commonPipeline,
    //     { $count: "total" }
    // ]);
    // const totalCount = totalCountAgg[0]?.total || 0;
    // const totalPages = Math.ceil(totalCount / limit);
    // const students = await Student.aggregate([
    //     ...commonPipeline,
    //     {
    //         $project: {
    //             _id: 0,
    //             studentName: "$studentInfo.studentName",
    //             studentId: "$studentInfo.studentId",
    //             studentPhoneNumber: "$studentInfo.studentPhoneNumber",
    //             fatherName: "$studentInfo.fatherName",
    //             fatherPhoneNumber: "$studentInfo.fatherPhoneNumber",
    //             courseName: 1,
    //             courseYear: "$currentSemesterData.courseYear",
    //             semester: "$currentSemesterData.semesterNumber",
    //             feeStatus: 1
    //         }
    //     },
    //     { $sort: { studentName: 1 } },
    //     { $skip: (page - 1) * limit },
    //     { $limit: limit }
    // ]);
    const studentAggregation = student_1.Student.aggregate([
        { $match: filterStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
            $project: {
                feeStatus: 1,
                courseName: 1,
                universityId: '$studentInfo.universityId',
                studentName: '$studentInfo.studentName',
                studentPhoneNumber: '$studentInfo.studentPhoneNumber',
                fatherName: '$studentInfo.fatherName',
                fatherPhoneNumber: '$studentInfo.fatherPhoneNumber',
                currentSemester: 1,
                courseYear: { $ceil: { $divide: ['$currentSemester', 2] } }
            }
        }
    ]);
    // Student.aggregate([
    //     { $skip: skip },
    //     { $limit: limit },
    //     {
    //         $project: {
    //             universityId: '$studentInfo.universityId',
    //             studentName: '$studentInfo.studentName',
    //             studentPhoneNumber: '$studentInfo.studentPhoneNumber',
    //             fatherName: '$studentInfo.fatherName',
    //             fatherPhoneNumber: '$studentInfo.fatherPhoneNumber',
    //             courseName: 1,
    //             currentAcademicYear: 1,
    //             currentSemester: 1,
    //         },
    //     },
    // ]);
    const countQuery = student_1.Student.countDocuments(filterStage);
    const [students, totalCount] = yield Promise.all([
        studentAggregation,
        countQuery
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, "Student with Due Fees fetched successfully", true, {
        data: students,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    });
}));
exports.fetchFeeInformationByStudentId = (0, express_async_handler_1.default)((req, res) => {
});
