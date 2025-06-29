import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose, { mongo } from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import createHttpError from "http-errors";
import { createPlanSchema, deleteFileUsingUrlSchema, deletePlanSchema, ICreatePlanSchema, IDeleteFileSchema, IDeletePlanSchema, IUpdatePlanSchema, updatePlanSchema } from "../validators/scheduleSchema";
import { CourseMaterialType } from "../../config/constants";
import { deleteFromS3 } from "../config/s3Delete";
import { fetchScheduleInformation } from "../helpers/fetchScheduleInformation";
import { deleteFromS3AndDB } from "../helpers/deleteFromS3AndDB";

export const planConfigMap = {
  lecture: {
    mongoPlanPath: 'lecturePlan',
    planKey: 'lp',
    createSuccessMessage: 'Lecture Plan created successfully',
    updateSuccessMessage: 'Lecture Plan updated successfully',
    deleteSuccessMessage: 'Lecture Plan deleted successfully'
  },
  practical: {
    mongoPlanPath: 'practicalPlan',
    planKey: 'pp',
    createSuccessMessage: 'Practical Plan created successfully',
    updateSuccessMessage: 'Practical Plan updated successfully',
    deleteSuccessMessage: 'Practical Plan deleted successfully'
  },
} as const;


export const createPlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: ICreatePlanSchema = req.body;

  const validation = createPlanSchema.safeParse(planData);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, type, ...planInformation } = planData;

  const config = type === CourseMaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);

  planInformation.instructor = instructorId;

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
  return formatResponse(res, 200, config!.createSuccessMessage, true, null);
})



export const batchUpdatePlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: IUpdatePlanSchema = req.body;
  const validation = updatePlanSchema.safeParse(planData);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, type, data } = planData;

  const config = type === CourseMaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;


  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);

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

  return formatResponse(res, 200, config.updateSuccessMessage, true, null);
})



export const deletePlan = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const planData: IDeletePlanSchema = req.body;

  const validation = deletePlanSchema.safeParse(planData);
  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId, instructorId, planId, type } = planData;

  const config = type === CourseMaterialType.LPLAN ? planConfigMap.lecture : planConfigMap.practical;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);
  instructorId = new mongoose.Types.ObjectId(instructorId);
  planId = new mongoose.Types.ObjectId(planId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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

    const documents = result[0]?.plan || [];

    await Course.updateOne(
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
        session,
        arrayFilters: [
          { "sem._id": semesterId },
          { "subj._id": subjectId },
        ]
      }
    );

    await session.commitTransaction();
    session.endSession();

    for (const docUrl of documents) {
      await deleteFromS3(docUrl);
    }
    return formatResponse(res, 200, config.deleteSuccessMessage, true, null);
  }
  catch (error : any) {
    await session.abortTransaction();
    session.endSession();
    throw createHttpError(404, error.message);
  }
});



export const getScheduleInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, subjectId, instructorId, search, page = 1, limit = 10 } = req.body;
  let payload = await fetchScheduleInformation(courseId, semesterId, subjectId, instructorId);
  return formatResponse(res, 200, 'Plans fetched successfully', true, payload);
})



export const deleteFileUsingUrl = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  
  //In case of additional resource deletion, planId would be null, it will only be present for lecture plan and practical plan.
  const deleteFileData : IDeleteFileSchema = req.body;

  const validation = deleteFileUsingUrlSchema.safeParse(deleteFileData);

  if(!validation.success)
    throw createHttpError(400, validation.error.errors[0]);
  
  try {
    await deleteFromS3AndDB(validation.data.courseId.toString(), validation.data.semesterId.toString(), validation.data.subjectId.toString(), validation.data.planId?.toString(), validation.data.type ? validation.data.type : undefined, validation.data.documentUrl);
  }
  catch (error: any) {
    throw createHttpError(404, error.message);
  }
  return formatResponse(res, 200, 'Removed successfully from AWS and database', true);
})



