import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { FeeStatus } from "../../config/constants";
import { Student } from "../models/student";
import { formatResponse } from "../../utils/formatResponse";

//DACHECK : Here, it won't make sense to have filter on academic year, we can discuss this in meeting.
export const getStudentDues = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, search, academicYear } = req.body;

    const filterStage: any = {
        feeStatus: FeeStatus.DUE,
        currentAcademicYear: academicYear
    };

    if (search?.trim()) {
        filterStage.$and = [
            ...(filterStage.$and ?? []),
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

    const studentAggregation = Student.aggregate([
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

    const countQuery = Student.countDocuments(filterStage);

    const [students, totalCount] = await Promise.all([
        studentAggregation,
        countQuery
    ]);

    return formatResponse(res, 200, "Student with Due Fees fetched successfully", true, {
        data: students,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        }
    })
});

export const fetchFeeInformationByStudentId = expressAsyncHandler((req: AuthenticatedRequest, res: Response) => {

});