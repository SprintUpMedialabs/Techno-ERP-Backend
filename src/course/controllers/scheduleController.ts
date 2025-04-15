import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import createHttpError from "http-errors";
import { createPlanSchema, deletePlanSchema, ICreatePlanSchema, IDeletePlanSchema, IUpdatePlanSchema, updatePlanSchema } from "../validators/scheduleSchema";
import { MaterialType } from "../../config/constants";
import { deleteFromS3 } from "../config/s3Delete";

const planConfigMap = {
  lecture: {
    mongoPlanPath: 'lecturePlan',
    planKey: 'lp',
    createSuccessMessage: 'Lecture Plan created successfully',
    updateSuccessMessage: 'Lecture Plan updated successfully',
    deleteSuccessMessage : 'Lecture Plan deleted successfully'
  },
  practical: {
    mongoPlanPath: 'practicalPlan',
    planKey: 'pp',
    createSuccessMessage: 'Practical Plan created successfully',
    updateSuccessMessage: 'Practical Plan updated successfully',
    deleteSuccessMessage : 'Practical Plan deleted successfully'
  },
} as const;


export const createPlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: ICreatePlanSchema = req.body;

  const validation = createPlanSchema.safeParse(planData);
  console.log(validation.error)

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, type, ...planInformation } = planData;

  const config = type === MaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);

  planInformation.instructor = instructorId;

  console.log(planInformation);

  const createdSchedule = await Course.findByIdAndUpdate(
    courseId,
    {
      $push: {
        [`semester.$[sem].subjects.$[subj].schedule.${config!.mongoPlanPath}`]: planInformation,
      }
    },
    {
      new: true,
      arrayFilters: [
        { "sem._id": semesterId },
        { "subj._id": subjectId }
      ]
    }
  );

  const responsePayload = await fetchScheduleInformation(courseId.toString(), semesterId.toString(), subjectId.toString(), instructorId.toString());

  return formatResponse(res, 200, config!.createSuccessMessage, true, responsePayload);
})


export const batchUpdatePlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: IUpdatePlanSchema = req.body;
  console.log(planData.data)
  const validation = updatePlanSchema.safeParse(planData);
  console.log(validation.error)

  console.log(planData.data);
  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, type, data } = planData;

  const config = type === MaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;


  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);

  console.log("Data to be updated", data);
  const updateResult = await Course.updateOne(
    {
      _id: courseId,
      "semester._id": semesterId,
      "semester.subjects._id": subjectId,
    },
    {
      $set: {
        [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}`]: data,
      },
    },
    {
      arrayFilters: [
        { "sem._id": semesterId },
        { "subj._id": subjectId },
      ],
    }
  );

  console.log(updateResult.modifiedCount);
  const responsePayload = await fetchScheduleInformation(courseId.toString(), semesterId.toString(), subjectId.toString(), instructorId.toString());

  return formatResponse(res, 200, config!.updateSuccessMessage, true, responsePayload);
})


export const deletePlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: IDeletePlanSchema = req.body;

  const validation = deletePlanSchema.safeParse(planData);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, planId, type  } = planData;

  
  const config = type === MaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);
  planId = new mongoose.Types.ObjectId(planId);

  const result = await Course.aggregate([
    { $match: { _id: courseId } },
    { $unwind: "$semester" },
    { $match: { "semester._id": semesterId } },
    { $unwind: "$semester.subjects" },
    { $match: { "semester.subjects._id": subjectId } },
    { $unwind: `$semester.subjects.schedule.${config.mongoPlanPath}` },
    {
      $match: {
        [`semester.subjects.schedule.${config.mongoPlanPath}._id`]: planId
      }
    },
    {
      $project: {
        _id: 0,
        plan: `$semester.subjects.schedule.${config.mongoPlanPath}.documents`,
      },
    },
  ]);


  const documents = result[0]?.plan;
 
  for (const docUrl of documents) {
    await deleteFromS3(docUrl); 
  }
  
  const deleteResult = await Course.updateOne(
    {
      _id: courseId,
      "semester._id": semesterId,
      "semester.subjects._id": subjectId,
    },
    {
      $pull: {
        [`semester.$[sem].subjects.$[subj].schedule.${config.mongoPlanPath}`]: { _id: planId }
      }                                                                    
    },
    {
      arrayFilters: [
        { "sem._id": semesterId },
        { "subj._id": subjectId },
      ]
    }
  );                  
  const responsePayload = await fetchScheduleInformation(courseId.toString(), semesterId.toString(), subjectId.toString(), instructorId.toString());

  return formatResponse(res, 200, config!.deleteSuccessMessage, true, responsePayload);
})


export const getScheduleInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, subjectId, instructorId, search, page = 1, limit = 10 } = req.body;
  let payload = await fetchScheduleInformation(courseId, semesterId, subjectId, instructorId);
  return formatResponse(res, 200, 'Plans fetched successfully', true, payload);
})


export const deleteFileFromS3UsingUrl = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response) => {

  const { documentUrl } = req.body;
  await deleteFromS3(documentUrl);

  return formatResponse(res, 200, 'Removed successfully from AWS', true);
})


export const fetchScheduleInformation = async (crsId: string, semId: string, subId: string, insId: string) => {
  let courseId = new mongoose.Types.ObjectId(crsId);
  let semesterId = new mongoose.Types.ObjectId(semId);
  let subjectId = new mongoose.Types.ObjectId(subId);
  let instructorId = new mongoose.Types.ObjectId(insId);

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
        from: "users", // your actual users collection
        let: { instructorId: instructorId }, // pass instructorId from input
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

  let subjectDetails = await Course.aggregate(pipeline);

  let payload = subjectDetails[0];

  return payload;
}
