import mongoose from "mongoose";
import { Course } from "../models/course";
import { transformDates } from "../utils/transformDates";

export const fetchScheduleInformation = async (crsId: string, semId: string, subId: string, insId: string) => {
    let courseId = new mongoose.Types.ObjectId(crsId);
    let semesterId = new mongoose.Types.ObjectId(semId);
    let subjectId = new mongoose.Types.ObjectId(subId);
    let instructorId = new mongoose.Types.ObjectId(insId);
    
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
                    $and: [
                      { $eq: ["$$lp.instructor", instructorId] },
                    ]
                  },
                },
              },
              matchingPracticalPlans: {
                $filter: {
                  input: "$semesterDetails.subjects.schedule.practicalPlan",
                  as: "pp",
                  cond: {
                    $and: [
                      { $eq: ["$$pp.instructor", instructorId] },
                    ]
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
                preserveNullAndEmptyArrays: true 
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
                academicYear : "$semesterDetails.academicYear",
                subjectName: "$semesterDetails.subjects.subjectName",
                subjectCode: "$semesterDetails.subjects.subjectCode",
                instructorName: {
                    $concat: [
                      "$instructorDetails.firstName",
                      " ",
                      "$instructorDetails.lastName"
                    ]
                  },

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

    let subjectDetails = await Course.aggregate(pipeline);
    let payload = subjectDetails[0];
    payload = transformDates(payload);
    return payload;
}

