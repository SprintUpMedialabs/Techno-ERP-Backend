import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import createHttpError from "http-errors";
import { DepartmentModel } from "../models/department";
import { IScheduleRequestSchema, IScheduleUpdateSchema, IScheduleSchema } from "../validators/scheduleSchema";
import { Types } from "mongoose";
import { formatResponse } from "../../utils/formatResponse";
import { z } from "zod";
import { scheduleRequestSchema, scheduleUpdateSchema } from "../validators/scheduleSchema";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";


export const createSchedule = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response) => {

    const createScheduleData : IScheduleRequestSchema = req.body;
    const validation = scheduleRequestSchema.safeParse(createScheduleData);

    if(!validation.success)
    {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { subjectId, lectureNumber, topicName, description, plannedDate, dateOfLecture, confirmation, remarks } = validation.data;

    const newSchedule = {
        lectureNumber, 
        topicName,
        description,
        plannedDate, 
        dateOfLecture, 
        confirmation, 
        remarks
    };

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        {
            "courses.semester.subjectDetails._id": subjectId
        },
        {
            $push: { "courses.$.semester.$[sem].subjectDetails.$[subj].schedule": newSchedule }
        },
        {
            new: true,
            arrayFilters: [
                { "sem.subjectDetails._id": subjectId },
                { "subj._id": subjectId }
            ],
            projection: {
                "courses": {
                    $elemMatch: {
                        "semester.subjectDetails._id": subjectId 
                    }
                }
            }
        }
    );

    return formatResponse(res, 201, "Schedule Created Successfully", true, updatedDepartment);
});



export const updateSchedule = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const updateScheduleData : IScheduleUpdateSchema = req.body;
    const validation = scheduleUpdateSchema.safeParse(updateScheduleData);

    if(!validation.success)
        throw createHttpError(400, validation.error.errors[0]);


    const { scheduleId, topicName, lectureNumber, description, dateOfLecture, plannedDate, confirmation, remarks} = validation.data;


    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        {
            "courses.semester.subjectDetails.schedule._id": scheduleId
        },
        {
            $set: {
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].lectureNumber": lectureNumber,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].topicName": topicName,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].description": description,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].plannedDate": plannedDate,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].dateOfLecture": dateOfLecture,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].confirmation": confirmation,
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule.$[sched].remarks": remarks
            }
        },
        {
            new: true,
            arrayFilters: [
                { "sem.subjectDetails.schedule._id" : scheduleId },
                { "subj.schedule._id": scheduleId },
                { "sched._id": scheduleId }
            ],
            projection: {
                "courses": {
                    $elemMatch: {
                        "semester.subjectDetails.schedule._id": scheduleId 
                    }
                }
            }
        }
    );


    return formatResponse(res, 200, "Schedule Updated Successfully", true, updatedDepartment);
});


export const deleteSchedule = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId, scheduleId } = req.body;

    if (!Types.ObjectId.isValid(subjectId) || !Types.ObjectId.isValid(scheduleId)) {
        throw createHttpError(400, "Invalid subjectId or scheduleId");
    }

    const updatedDepartment = await DepartmentModel.findOneAndUpdate(
        {
            "courses.semester.subjectDetails._id": subjectId,
            "courses.semester.subjectDetails.schedule._id": scheduleId
        },
        {
            $pull: {
                "courses.$.semester.$[sem].subjectDetails.$[subj].schedule": { _id: scheduleId }
            }
        },
        {
            new: true, 
            arrayFilters: [
                { "sem.subjectDetails._id": subjectId }, 
                { "subj._id": subjectId } 
            ],
            projection: {
                "courses": {
                    $elemMatch: {
                        "semester.subjectDetails._id": subjectId 
                    }
                }
            }
        }
    );

    return formatResponse(res, 200, "Schedule deleted successfully", true, updatedDepartment);
});
