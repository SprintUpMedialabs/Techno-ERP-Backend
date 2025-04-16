import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose, { Mongoose } from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { createSubjectSchema, deleteSubjectSchema, ICreateSubjectSchema, IDeleteSubjectSchema, IUpdateSubjectSchema, updateSubjectSchema } from "../validators/subjectSchema";
import createHttpError from "http-errors";
import { deleteFromS3 } from "../config/s3Delete";

export const getSubjectInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, search, page = 1, limit = 10 } = req.body;

  const responsePayload = await fetchSubjectInformation(courseId, semesterId, search, page, limit);
  return formatResponse(res, 200, 'Subject Details fetched for course and semester', true, responsePayload);
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
  const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(), "", 1, 10);

  return formatResponse(res, 201, 'Successfully added subject information', true, responsePayload);
});


export const updateSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updateSubjectData: IUpdateSubjectSchema = req.body;

  const validation = updateSubjectSchema.safeParse(updateSubjectData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { courseId, semesterId, subjectId, subjectName, subjectCode, instructor } = updateSubjectData;

  const updatedSubject = await Course.findOneAndUpdate(
    {
      _id: courseId,
      "semester._id": semesterId,
      "semester.subjects._id": subjectId,
    },
    {
      $set: {
        "semester.$[sem].subjects.$[subj].subjectName": subjectName,
        "semester.$[sem].subjects.$[subj].subjectCode": subjectCode,
        "semester.$[sem].subjects.$[subj].instructor": instructor,
      },
    },
    {
      new: true,
      arrayFilters: [
        { "sem._id": semesterId },
        { "subj._id": subjectId }
      ],
      runValidators: true
    }
  );

  if (!updatedSubject) {
    throw createHttpError(404, 'Subject not found in course');
  }

  const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(), "", 1, 10);

  return formatResponse(res, 200, 'Subject updated successfully', true, responsePayload);
});


export const deleteSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log("Deleting subject");
  const deleteSubjectData: IDeleteSubjectSchema = req.body;
  console.log(deleteSubjectData);
  const validation = deleteSubjectSchema.safeParse(deleteSubjectData);

  console.log(validation.error);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId } = deleteSubjectData;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);


  const session = await mongoose.startSession();
  try {
    const result = await Course.aggregate([
      { $match: { _id: courseId } },
      { $unwind: "$semester" },
      { $match: { "semester._id": semesterId } },
      { $unwind: "$semester.subjects" },
      { $match: { "semester.subjects._id": subjectId } },
      {
        $project: {
          lecturePlan: {
            $reduce: {
              input: "$semester.subjects.schedule.lecturePlan",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  { $ifNull: ["$$this.documents", []] }
                ]
              }
            }
          },
          practicalPlan: {
            $reduce: {
              input: "$semester.subjects.schedule.practicalPlan",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  { $ifNull: ["$$this.documents", []] }
                ]
              }
            }
          },
          additionalResources: {
            $ifNull: ["$semester.subjects.schedule.additionalResources", []]
          }
        }
      }
    ]);

    let docs = result[0];
    let additionalResources = docs.additionalResources;
    let practicalPlanDocs = docs.practicalPlan;
    let lecturePlanDocs = docs.lecturePlan;

    let allDocs = [...additionalResources, ...practicalPlanDocs, ...lecturePlanDocs];

    console.log(allDocs);

    for (const docUrl of allDocs) {
      await deleteFromS3(docUrl);
    }

    // This we are keeping here because MongoDB transactions cannot be used to check if AWS deletion is successful or not, so if it would fail, then transaction won't be there, hence it would jump to catch block and no issue would be there.
    session.startTransaction();

    await Course.updateOne(
      {
        _id: courseId,
        "semester._id": semesterId,
        "semester.subjects._id": subjectId
      },
      {
        $set: {
          "semester.$[sem].subjects.$[subj].isDeleted": true
        }
      },
      {
        arrayFilters: [
          { "sem._id": semesterId },
          { "subj._id": subjectId }
        ],
        session
      }
    );

    console.log("Object of subject updated in db");
    await session.commitTransaction();
    session.endSession();

    const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(), "", 1, 10);

    return formatResponse(res, 200, 'Subject Deleted Successfully', true, responsePayload);
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction Error:", error);
    throw createHttpError(500, "Failed to delete subject");
  }
  finally {
    await session.endSession();
  }
});



export const fetchSubjectInformation = async (crsId: string, semId: string, search: string, page: number = 1, limit: number = 10) => {

  let courseId = new mongoose.Types.ObjectId(crsId);
  let semesterId = new mongoose.Types.ObjectId(semId);
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
      $match: {
        "semesterDetails.subjects.isDeleted": { $ne: true },
        ...(search && {
          $or: [
            { "semesterDetails.subjects.subjectName": { $regex: search, $options: "i" } },
            { "semesterDetails.subjects.subjectCode": { $regex: search, $options: "i" } }
          ]
        })
      }
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

  let subjectInformation = subjectDetails[0];

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

  return {
    subjectInformation,
    pagination: {
      currentPage: page,
      totalItems,
      totalPages,
    }
  };
}