import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express"
import { IScheduleRequestSchema, IScheduleUpdateSchema, scheduleRequestSchema, scheduleUpdateSchema } from "../validators/scheduleSchema";
import createHttpError from "http-errors";
import { CourseModel } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";

export const createSchedule = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const scheduleData: IScheduleRequestSchema = req.body;

    const validation = scheduleRequestSchema.safeParse(scheduleData);
    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { subjectId } = validation.data;

    const isExists = await CourseModel.exists({
        "semester.subjects._id": subjectId,
        "semester.subjects.schedule.lectureNumber": validation.data.lectureNumber
    });

    if (isExists) {
        throw createHttpError(400, `Lecture number '${validation.data.lectureNumber}' already exists`);
    }

    const updatedSchedule = await CourseModel.findOneAndUpdate(
        { "semester.subjects._id": subjectId },
        {
            $push: {
                "semester.$.subjects.$[subject].schedule": scheduleData
            }
        },
        {
            new: true,
            runValidators: true
        }
    );
    if (!updatedSchedule) {
        throw createHttpError(404, 'Could not create schedule');
    }
    return formatResponse(res, 201, 'Schedule created successfully', true, updatedSchedule);
});


export const updateSchedule = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const scheduleData: IScheduleUpdateSchema = req.body;

    const validation = scheduleUpdateSchema.safeParse(scheduleData);
    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { scheduleId, lectureNumber, topicName, description, plannedDate, dateOfLecture, confirmation, remarks } = validation.data;

    const updateScheduleCourse = await CourseModel.findOneAndUpdate(
        { "semester.subjects.schedule._id": scheduleId },
        {
            $set: {
                "semester.$[].subjects.$[].schedule.$[schedule].lectureNumber": lectureNumber,
                "semester.$[].subjects.$[].schedule.$[schedule].topicName": topicName,
                "semester.$[].subjects.$[].schedule.$[schedule].description": description,
                "semester.$[].subjects.$[].schedule.$[schedule].plannedDate": plannedDate,
                "semester.$[].subjects.$[].schedule.$[schedule].dateOfLecture": dateOfLecture,
                "semester.$[].subjects.$[].schedule.$[schedule].confirmation": confirmation,
                "semester.$[].subjects.$[].schedule.$[schedule].remarks": remarks
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updateScheduleCourse) {
        throw createHttpError(404, 'Schedule not found');
    }

    return formatResponse(res, 200, 'Schedule updated successfully', true, updateScheduleCourse);
});


export const deleteSchedule = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw createHttpError(400, 'Schedule ID is required');
    }

    const updatedCourse = await CourseModel.findOneAndUpdate(
        { "semester.subjects.schedule._id": id },
        {
            $pull: {
                "semester.$[].subjects.$[].schedule": { _id: id }
            }
        },
        {
            new: true
        }
    );

    if (!updatedCourse) throw createHttpError(404, 'Schedule not found');

    return formatResponse(res, 200, 'Schedule deleted successfully', true, updatedCourse);
});