import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { createLecturePlanSchema, ICreateLecturePlanSchema } from "../validators/scheduleSchema";
import createHttpError from "http-errors";

export const getScheduleInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, subjectId, instructorId, search, page = 1, limit = 10 } = req.body;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);

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

  let subjectDetails = await Course.aggregate(pipeline);

  let payload = subjectDetails[0];

  return formatResponse(res, 200, 'Plans fetched successfully', true, payload);
})


export const createLecturePlan = expressAsyncHandler((req : AuthenticatedRequest, res : Response) => {
  const lecturePlanData : ICreateLecturePlanSchema = req.body;

  const validation = createLecturePlanSchema.safeParse(lecturePlanData);

  if(!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, ...lecturePlan } = lecturePlanData;


  //Ahiya thi baaki che.

})