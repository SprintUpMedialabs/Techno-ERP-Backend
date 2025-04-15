import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose, { Mongoose } from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { createSubjectSchema, ICreateSubjectSchema } from "../validators/subjectSchema";
import createHttpError from "http-errors";

export const getSubjectInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, search, page = 1, limit = 10 } = req.body;

  console.log(courseId);
  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  const skip = (page - 1) * limit;

  // console.log(courseId);
  // console.log(semesterId);
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

  let subjectDetails = await Course.aggregate(pipeline);

  let payload = subjectDetails[0];

  const totalCount = await Course.aggregate([
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

  return formatResponse(res, 200, 'Subject Details fetched for course and semester', true, {
    payload,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
    },
  });
});


export const createSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subjectData: ICreateSubjectSchema = req.body;

  const validation = createSubjectSchema.safeParse(subjectData);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId } = subjectData;

  const { subjectName, subjectCode, instructor } = subjectData;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);

  const instructorIds = instructor || [];

  const instructorObjectIDs = instructorIds.map(id => new mongoose.Types.ObjectId(id));

  const updateSemesterInformation = await Course.updateOne(
    { _id: courseId, "semester._id": semesterId },
    {
      $push: {
        "semester.$.subjects": {
          subjectName,
          subjectCode,
          instructor: instructorObjectIDs,
        }
      }
    }
  );

  if (updateSemesterInformation.modifiedCount === 0) {
    throw createHttpError(404, 'Error occurred saving the subject information');
  }

  return formatResponse(res, 201, 'Successfully added subject information', true, updateSemesterInformation);
});




